# Competitor System Specification

## Overview
This document details the comprehensive competitor monitoring and rate tracking system in the MetaCX application, covering competitor management, rate scraping, price comparison, issue monitoring, and competitive intelligence features.

## Business Rules

### Competitor Types
1. **Cryptocurrency Exchanges**: Digital currency trading platforms
2. **Financial Institutions**: Banks and traditional financial services
3. **Currency Exchange Services**: Physical and online currency exchanges
4. **Precious Metals Dealers**: Gold and silver traders

### Rate Monitoring
- **Real-time Scraping**: Automated rate collection from competitor websites
- **Buy/Sell Prices**: Track both buy and sell rates for each competitor
- **Currency Coverage**: Monitor fiat, cryptocurrency, and precious metals
- **Update Frequency**: Configurable scraping intervals and schedules

### Competitor Status
- **Active**: Currently being scraped and monitored
- **Inactive**: Temporarily disabled from monitoring
- **Broken**: Scraping failed and requires attention
- **Flagged**: Issues detected requiring manual review

### Data Quality
- **Rate Validation**: Ensure collected rates are reasonable and valid
- **Duplicate Detection**: Identify and handle duplicate rate entries
- **Historical Tracking**: Maintain rate history for trend analysis
- **Issue Reporting**: Track and report scraping failures and anomalies

## Legacy System Analysis (Rails Backend)

### Backend Competitor Models and Services

#### 1. Competitor Model (`/app/models/competitor.rb`)
```ruby
class Competitor < ApplicationRecord
  # Validations
  validates :name, presence: true, uniqueness: true
  validates :key, presence: true, uniqueness: true

  # Associations
  has_many :rates, class_name: 'CompetitorRate', foreign_key: :key, primary_key: :key, dependent: :destroy
end
```

#### 2. Competitor Rate Model (`/app/models/competitor_rate.rb`)
```ruby
class CompetitorRate < ApplicationRecord
  validates :buy_price, :sell_price, :key, :company, :ticker, presence: true

  def self.fiat_breakdown
    fiat_currencies = Currency.where(typeof: 'Fiat')
    self.breakdown.where(ticker: fiat_currencies.pluck(:ticker))
  end

  def self.crypto_breakdown
    crypto_currencies = Currency.where(typeof: 'Cryptocurrency')
    self.breakdown.where(ticker: crypto_currencies.pluck(:ticker))
  end

  def self.metal_breakdown
    metal_currencies = Currency.where(typeof: 'Metal')
    self.breakdown.where(ticker: metal_currencies.pluck(:ticker))
  end

  def self.breakdown
    d = Date.today
    previousYear = d.prev_year.year

    rate = CompetitorRate.where(
      'extract(year from created_at) = ? AND extract(month from created_at) = ? AND extract(day from created_at) = ?',
      d.year, d.month, d.day
    )
    
    while (rate == [] && d.year != previousYear)
      d -= 1
      rate = CompetitorRate.where(
        'extract(year from created_at) = ? AND extract(month from created_at) = ? AND extract(day from created_at) = ?',
        d.year, d.month, d.day
      )
    end
    return rate
  end

  def average_sell
    avg = self.sell_price.reduce { |a, b| a + b } / self.sell_price.length
    avg.round(2)
  end

  def average_buy
    avg = self.buy_price.reduce { |a, b| a + b } / self.buy_price.length
    avg.round(2)
  end
end
```

#### 3. Competitors Controller (`/app/controllers/api/v1/competitors_controller.rb`)
```ruby
class Api::V1::CompetitorsController < Api::V1::BaseController
  acts_as_token_authentication_handler_for User
  before_action :set_competitor, only: [:update]

  def list
    authorize Competitor

    competitors = Competitor.all
    competitor_keys = competitors.pluck(:key)

    latest_rates_query = CompetitorRate
                         .select('DISTINCT ON (key, ticker) *') 
                         .where(key: competitor_keys) 
                         .order('key, ticker, created_at DESC') 

    latest_rates = latest_rates_query.to_a 
    rates_by_key = latest_rates.group_by(&:key)

    competitors_with_rates = competitors.map do |competitor|
      competitor_data = competitor.as_json 
      competitor_data['rates'] = rates_by_key[competitor.key]&.map(&:as_json) || [] 
      competitor_data 
    end

    render json: competitors_with_rates
  end

  def update
    authorize @competitor

    if @competitor.update(competitor_params)
      render json: @competitor
    else
      render json: @competitor.errors, status: :unprocessable_entity
    end
  end

  private

  def set_competitor
    @competitor = Competitor.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Competitor not found' }, status: :not_found
  end

  def competitor_params
    params.require(:competitor).permit(
      :name, :website, :location_address, :scraping_active, :scraping_endpoint
    )
  end
end
```

#### 4. Competitor Rate Controller (`/app/controllers/api/v1/competitor_rate_controller.rb`)
```ruby
class Api::V1::CompetitorRateController < ApplicationController
  skip_before_action :authenticate_user!
  before_action :authorize_current_user
  acts_as_token_authentication_handler_for User
  protect_from_forgery with: :null_session

  def index
    active_competitor_keys = Competitor.where(scraping_active: true).pluck(:key)
    @rates = get_competitor_rates_for_today.filter do |rate|
      active_competitor_keys.include?(rate[:key])
    end

    respond_to { |f| f.json }
  end

  def enqueue_competitors_rates_refresh
    ScraperJob.set(wait: 1.seconds).perform_later()
    render json: { message: 'Rates refresh job enqueued' }, status: 200
  end

  def issues_report
    competitor_rates_for_today_with_issues = []
    competitor_rates_for_today = get_competitor_rates_for_today()
    last_competitor_rate_sample = competitor_rates_for_today&.last
    last_competitor_rate_sample_date = (last_competitor_rate_sample&.updated_at || Date.today) - 30.minutes

    competitor_rate_flags_for_today = Flag
      .select('DISTINCT ON (name) name, updated_at, subject_name, category, external')
      .where(category: 'COMPETITOR_RATE_UPDATE_FAILURE')
      .where('created_at >= ?', last_competitor_rate_sample_date)
      .order('name, updated_at DESC')

    competitor_rate_flags_for_today.each do |flag|
      competitor = flag.subject_name
      next if competitor.nil?

      matching_competitor_rate_for_today = competitor_rates_for_today.find { |rate| rate.company == competitor }

      if matching_competitor_rate_for_today.nil?
        competitor_rates_for_today_with_issues << flag
      elsif flag.updated_at > matching_competitor_rate_for_today.updated_at
        competitor_rates_for_today_with_issues << flag
      end
    end

    render json: competitor_rates_for_today_with_issues, status: 200
  end

  def toggle
    status = params['Status']
    id = params['Id'].to_i
    rate = CompetitorRate.find(id)
    rate.broken = status
    
    if rate.save!
      render html: "Scraper ID: #{rate.id} successfully updated: Status: broken=#{rate.broken}"
    else
      message = "Scraper will not update its status: broken=#{rate.broken}"
      BugMailer.scraper(competitor.key, rate.id, message).deliver_now
      render html: 'Scraper successfully turned off.'
    end
  end

  def get_competitor_rates_for_today
    fiat_rates = CompetitorRate.fiat_breakdown
    crypto_rates = CompetitorRate.crypto_breakdown
    fiat_rates + crypto_rates
  end
end
```

#### 5. Competitor Helper (`/app/helpers/competitor_helper.rb`)
```ruby
module CompetitorHelper
  def self.ensure_competitor_is_active(competitor_details)
    begin
      competitor_exists = Competitor.where(key: competitor_details[:key])

      if competitor_exists.empty?
        Competitor.create!(
          key: competitor_details[:key],
          name: competitor_details[:company],
          location_address: competitor_details[:address],
          website: competitor_details[:website],
          scraping_active: true
        )
        return true
      else
        competitor_is_active = competitor_exists.pluck(:scraping_active).include?(true)
        return competitor_is_active
      end
    rescue => e
      Rails.logger.error("Error in ensure_competitor_is_active: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      return false
    end
  end
end
```

#### 6. Canadian Bitcoins Scraper Example (`/app/jobs/scraper_scripts/canadian_bitcoins_scraper.rb`)
```ruby
module ScraperScripts
  class CanadianBitcoinsScraper
    def self.scrape(currencies)
      begin
        tickers = {}
        currencies.each { |currency| tickers[currency.name] = currency.ticker }
        ticker_names = tickers.values

        competitor_details = {
          key: 'CANBTC',
          company: 'Canadian Bitcoins',
          address: 'CB, 21 Concourse Gate. Unit 5 (Ground Floor), Ottawa, Ontario, K2E 7S4',
          website: 'https://www.canadianbitcoins.com',
          scrape_endpoint: 'https://www.canadianbitcoins.com'
        }

        is_competitor_active = CompetitorHelper.ensure_competitor_is_active(competitor_details)
        return [] unless is_competitor_active

        rates = []
        url = competitor_details[:scrape_endpoint]
        doc = Nokogiri::HTML.parse(URI.open(url))

        doc.css('#ticker table tr').each do |tr|
          name = tr.css('td:nth-of-type(1)').text
          next if name == '' || name.nil?

          ticker = tickers[name]
          next if ticker.nil?

          currency = CurrencyHelper.get_currency_from_possible_ticker(currencies, ticker)
          next unless currency.present?
          next unless ticker_names.include?(currency.ticker)

          buy_price = tr.css('td:nth-of-type(4)').text.split('$')[1].split(' ')[0].to_f
          sell_price = tr.css('td:nth-of-type(5)').text.split('$')[1].split(' ')[0].to_f

          rates << {
            key: competitor_details[:key],
            company: competitor_details[:company],
            ticker: currency.ticker,
            buy_price: buy_price,
            sell_price: sell_price,
            broken: false
          }
        end

        return rates
      rescue => e
        Rails.logger.error("Canadian Bitcoins scraper error: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        
        # Create flag for scraping failure
        Flag.create!(
          name: "#{competitor_details[:key]}_SCRAPER_ERROR",
          subject_name: competitor_details[:company],
          category: 'COMPETITOR_RATE_UPDATE_FAILURE',
          external: true,
          description: e.message
        )
        
        return []
      end
    end
  end
end
```

### Frontend Competitor Management

#### 1. Competitor API (`/src/apis/competitor.js`)
```javascript
export const enqueueCompetitorsRatesRefreshAPI = async (sessionData) => {
  const { userEmail, userToken, baseUrl } = sessionData
  try {
    const results = await fetch(`${baseUrl}/api/v1/competitor_rate/enqueue_competitors_rates_refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail,
        'X-User-Token': userToken
      }
    })

    const data = await results.json()
    AppToast('Currency rates refresh enqueued.', 'success')
    return data
  } catch (err) {
    console.error(err)
    AppToast('Unable to enqueue currency rates refresh.', 'warning')
  }
}
```

#### 2. Competitor Data Helper (`/src/pages/Dashboard/SharedViews/Competitors/data.js`)
```javascript
export const fetchCompetitorData = sessionData => {
  const { userEmail, userToken, baseUrl } = sessionData
  const endpoint = `${baseUrl}/api/v1/competitor_rate/index`

  return fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-type': 'application/json',
      'X-User-Email': userEmail,
      'X-User-Token': userToken
    }
  })
    .then(response => response.json())
    .then(data => data)
    .catch()
}

export const updateCompetitorScrapperStatus = ({ sessionData, name, status, id }) => {
  const { userEmail, userToken, baseUrl } = sessionData
  const endpoint = `${baseUrl}/api/v1/competitor_rate_toggle`

  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-User-Email': `${userEmail}`,
      'X-User-Token': `${userToken}`
    },
    body: JSON.stringify({
      Key: `${name}`,
      Status: `${!status}`,
      Id: `${id}`
    })
  })
    .then(response => {
      if (response.ok) {
        AppToast('Successful updated competitor monitoring', 'success')
        return response.json()
      }
    })
    .catch(error => {
      AppToast('Failed to update competitor monitoring', 'error')
      console.log('Failed to update competitor monitoring', error)
      return false
    })
}

export const fetchCompetitorRatesIssuesReport = sessionData => {
  const { userEmail, userToken, baseUrl } = sessionData
  const endpoint = `${baseUrl}/api/v1//competitor_rate/issues_report`

  return fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': userEmail,
      'X-User-Token': userToken
    }
  })
    .then(response => {
      if (response.ok) {
        return response.json()
      } else {
        throw new Error('Failed to fetch competitor rates issues report')
      }
    })
    .catch(error => {
      AppToast(error.message, 'error')
      console.error(error)
      return false
    })
}
```

#### 3. Competitor Logic Helper (`/src/pages/Dashboard/SharedViews/Competitors/logic.js`)
```javascript
export const formatCompetitorSpotRateDifference = rate => {
  return ((parseFloat(rate || 0) - 1) * 100).toFixed(4)
}

export const formatCompetitorData = competitorData => {
  const competitorsList = []
  const fetchLatestPrice = rate => rate[rate.length - 1].toFixed(4)

  competitorData.forEach(rate => {
    const formattedRate = {
      id: rate.id,
      name: rate.company,
      key: rate.key,
      website: rate.scrape_endpoint || rate.website,
      buyPrice: fetchLatestPrice(rate.buy_price),
      sellPrice: fetchLatestPrice(rate.sell_price),
      lastUpdated: rate.updated_at,
      lastCreated: rate.created_at,
      broken: rate.broken,
      ticker: rate.ticker,
      weight: 5
    }

    competitorsList.push(formattedRate)
  })

  return competitorsList
}

export const getPriceData = (competitorsList, direction, selectedCurrency) => {
  const sortedList = competitorsList
    .filter(curr => curr.buyPrice > 0)
    .sort((a, b) => {
      if (direction === 'BUY') {
        return a.buyPrice - b.buyPrice
      } else {
        return a.sellPrice - b.sellPrice
      }
    })

  // Calculate weighted average buy/sell price
  let weightedAvg = 0

  sortedList.forEach(competitor => {
    if (direction === 'BUY') {
      weightedAvg +=
        (competitor.weight / calculateTotalWeight(competitorsList, selectedCurrency)) *
        competitor.buyPrice
    } else {
      weightedAvg +=
        (competitor.weight / calculateTotalWeight(competitorsList, selectedCurrency)) *
        competitor.sellPrice
    }
  })

  return [sortedList, weightedAvg]
}

export const calculateTotalWeight = (competitorsList, selectedCurrency) => {
  let sum = 0

  competitorsList
    .filter(c => c.ticker === selectedCurrency)
    .forEach(c => {
      if (c.weight && c.buyPrice > 0 && c.sellPrice > 0) {
        sum += c.weight
      }
    })

  return sum
}
```

## Technical Implementation (MetaCX/Convex)

### Competitor Schema and Models
```typescript
// Competitors table schema
export const competitors = pgTable("org_competitors", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  
  // Basic competitor information
  key: varchar("key", { length: 50 }).notNull().unique(), // Unique identifier for scraping
  name: varchar("name", { length: 255 }).notNull(),
  website: varchar("website", { length: 500 }),
  locationAddress: varchar("location_address", { length: 500 }),
  
  // Scraping configuration
  scrapingActive: boolean("scraping_active").default(true),
  scrapingEndpoint: varchar("scraping_endpoint", { length: 500 }),
  scrapingInterval: integer("scraping_interval").default(300), // seconds
  scrapingMethod: varchar("scraping_method", { length: 50 }).default("HTML"), // "HTML" | "API" | "JSON"
  
  // Status and metadata
  status: varchar("status", { length: 50 }).default("ACTIVE"), // "ACTIVE" | "INACTIVE" | "BROKEN"
  lastScrapeAt: timestamp("last_scrape_at"),
  lastSuccessfulScrapeAt: timestamp("last_successful_scrape_at"),
  totalScrapes: integer("total_scrapes").default(0),
  failedScrapes: integer("failed_scrapes").default(0),
  
  // Configuration
  weight: integer("weight").default(5), // Weight for price averaging
  currencyTypes: varchar("currency_types", { length: 100 }).default("FIAT,CRYPTO"), // Comma-separated
  rateThreshold: decimal("rate_threshold", { precision: 10, scale: 4 }).default("0.1000"), // Max rate deviation
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Competitor rates table schema
export const competitorRates = pgTable("org_competitor_rates", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  competitorId: integer("competitor_id").references(() => competitors.id).notNull(),
  competitorKey: varchar("competitor_key", { length: 50 }).notNull(),
  
  // Rate information
  ticker: varchar("ticker", { length: 20 }).notNull(),
  buyPrice: decimal("buy_price", { precision: 20, scale: 8 }).notNull(),
  sellPrice: decimal("sell_price", { precision: 20, scale: 8 }).notNull(),
  spread: decimal("spread", { precision: 20, scale: 8 }), // Calculated spread
  
  // Quality and status
  broken: boolean("broken").default(false),
  validated: boolean("validated").default(false),
  validationErrors: json("validation_errors"), // Array of validation error messages
  
  // Metadata
  source: varchar("source", { length: 100 }), // Source of the rate data
  scrapeDuration: integer("scrape_duration"), // Time taken to scrape in milliseconds
  rateAge: integer("rate_age"), // Age of rate data in seconds
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Competitor scraping logs for audit trail
export const competitorScrapingLogs = pgTable("org_competitor_scraping_logs", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  competitorId: integer("competitor_id").references(() => competitors.id).notNull(),
  
  // Scraping session details
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // Duration in milliseconds
  
  // Results
  status: varchar("status", { length: 50 }).notNull(), // "SUCCESS" | "FAILURE" | "PARTIAL"
  ratesCollected: integer("rates_collected").default(0),
  ratesValidated: integer("rates_validated").default(0),
  ratesRejected: integer("rates_rejected").default(0),
  
  // Error details
  errorMessage: text("error_message"),
  errorDetails: json("error_details"), // Detailed error information
  
  // Performance metrics
  requestsMade: integer("requests_made").default(0),
  responseTime: integer("response_time"), // Average response time in milliseconds
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Competitor flags for issue tracking
export const competitorFlags = pgTable("org_competitor_flags", {
  id: serial("id").primaryKey(),
  clerkOrganizationId: varchar("clerk_organization_id", { length: 255 }).notNull(),
  competitorId: integer("competitor_id").references(() => competitors.id).notNull(),
  
  // Flag details
  flagType: varchar("flag_type", { length: 100 }).notNull(), // "SCRAPER_ERROR" | "RATE_ANOMALY" | "VALIDATION_FAILURE"
  severity: varchar("severity", { length: 20 }).default("MEDIUM"), // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Status and resolution
  status: varchar("status", { length: 50 }).default("ACTIVE"), // "ACTIVE" | "RESOLVED" | "IGNORED"
  resolvedBy: integer("resolved_by"), // User ID who resolved the flag
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  
  // Metadata
  metadata: json("metadata"), // Additional flag data
  userId: integer("user_id").notNull(), // User who created the flag
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Competitor Management Service
```typescript
export const createCompetitor = mutation({
  args: {
    clerkOrganizationId: v.string(),
    key: v.string(),
    name: v.string(),
    website: v.optional(v.string()),
    locationAddress: v.optional(v.string()),
    scrapingEndpoint: v.string(),
    scrapingInterval: v.optional(v.number()),
    scrapingMethod: v.optional(v.string()),
    weight: v.optional(v.number()),
    currencyTypes: v.optional(v.string()),
    rateThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 1. Check if competitor key already exists
    const existingCompetitor = await ctx.db
      .query("org_competitors")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    
    if (existingCompetitor) {
      throw new Error(`Competitor with key ${args.key} already exists`);
    }
    
    // 2. Create competitor
    const competitorId = await ctx.db.insert("org_competitors", {
      clerkOrganizationId: args.clerkOrganizationId,
      key: args.key,
      name: args.name,
      website: args.website,
      locationAddress: args.locationAddress,
      scrapingEndpoint: args.scrapingEndpoint,
      scrapingActive: true,
      scrapingInterval: args.scrapingInterval || 300,
      scrapingMethod: args.scrapingMethod || "HTML",
      status: "ACTIVE",
      weight: args.weight || 5,
      currencyTypes: args.currencyTypes || "FIAT,CRYPTO",
      rateThreshold: args.rateThreshold || 0.1000,
      totalScrapes: 0,
      failedScrapes: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // 3. Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: args.clerkOrganizationId,
      userId: identity.subject,
      sessionId: null,
      event: "COMPETITOR_CREATED",
      referenceId: competitorId,
      comment: `Created competitor: ${args.name}`,
      meta: {
        key: args.key,
        name: args.name,
        scrapingEndpoint: args.scrapingEndpoint,
      },
      createdAt: Date.now(),
    });
    
    return { success: true, competitorId };
  },
});
```

### Rate Collection Service
```typescript
export const collectCompetitorRates = mutation({
  args: {
    clerkOrganizationId: v.string(),
    competitorId: v.id("org_competitors"),
    rates: v.array(v.object({
      ticker: v.string(),
      buyPrice: v.number(),
      sellPrice: v.number(),
      source: v.optional(v.string()),
      rateAge: v.optional(v.number()),
    })),
    sessionId: v.string(),
    scrapeDuration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 1. Get competitor
    const competitor = await ctx.db.get(args.competitorId);
    if (!competitor) throw new Error("Competitor not found");
    
    // 2. Validate and store rates
    const validatedRates = [];
    const rejectedRates = [];
    
    for (const rateData of args.rates) {
      try {
        // Validate rate data
        const validationErrors = validateRateData(rateData);
        
        if (validationErrors.length === 0) {
          // Calculate spread
          const spread = rateData.sellPrice - rateData.buyPrice;
          
          // Store rate
          const rateId = await ctx.db.insert("org_competitor_rates", {
            clerkOrganizationId: args.clerkOrganizationId,
            competitorId: args.competitorId,
            competitorKey: competitor.key,
            ticker: rateData.ticker,
            buyPrice: rateData.buyPrice,
            sellPrice: rateData.sellPrice,
            spread: spread,
            broken: false,
            validated: true,
            source: rateData.source || "SCRAPER",
            scrapeDuration: args.scrapeDuration,
            rateAge: rateData.rateAge || 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          
          validatedRates.push(rateId);
        } else {
          rejectedRates.push({
            ticker: rateData.ticker,
            errors: validationErrors
          });
        }
      } catch (error) {
        rejectedRates.push({
          ticker: rateData.ticker,
          errors: [error.message]
        });
      }
    }
    
    // 3. Update competitor statistics
    await ctx.db.patch(args.competitorId, {
      lastScrapeAt: Date.now(),
      lastSuccessfulScrapeAt: validatedRates.length > 0 ? Date.now() : competitor.lastSuccessfulScrapeAt,
      totalScrapes: competitor.totalScrapes + 1,
      failedScrapes: validatedRates.length === 0 ? competitor.failedScrapes + 1 : competitor.failedScrapes,
      status: validatedRates.length > 0 ? "ACTIVE" : "BROKEN",
      updatedAt: Date.now(),
    });
    
    // 4. Create scraping log
    await ctx.db.insert("org_competitor_scraping_logs", {
      clerkOrganizationId: args.clerkOrganizationId,
      competitorId: args.competitorId,
      sessionId: args.sessionId,
      startTime: Date.now() - (args.scrapeDuration || 0),
      endTime: Date.now(),
      duration: args.scrapeDuration || 0,
      status: validatedRates.length > 0 ? "SUCCESS" : "FAILURE",
      ratesCollected: args.rates.length,
      ratesValidated: validatedRates.length,
      ratesRejected: rejectedRates.length,
      errorMessage: rejectedRates.length > 0 ? "Some rates failed validation" : null,
      errorDetails: rejectedRates.length > 0 ? rejectedRates : null,
      createdAt: Date.now(),
    });
    
    // 5. Create flag if scraping failed
    if (validatedRates.length === 0) {
      await ctx.db.insert("org_competitor_flags", {
        clerkOrganizationId: args.clerkOrganizationId,
        competitorId: args.competitorId,
        flagType: "SCRAPER_ERROR",
        severity: "HIGH",
        title: `Scraping failed for ${competitor.name}`,
        description: `No valid rates could be collected from ${competitor.scrapingEndpoint}`,
        status: "ACTIVE",
        userId: identity.subject,
        metadata: {
          sessionId: args.sessionId,
          totalRates: args.rates.length,
          rejectedRates: rejectedRates,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    return {
      success: true,
      competitorId: args.competitorId,
      ratesCollected: validatedRates.length,
      ratesRejected: rejectedRates.length,
      scrapingLog: {
        sessionId: args.sessionId,
        status: validatedRates.length > 0 ? "SUCCESS" : "FAILURE",
        duration: args.scrapeDuration,
      }
    };
  },
});

// Helper function for rate validation
function validateRateData(rateData: any): string[] {
  const errors: string[] = [];
  
  if (!rateData.ticker || rateData.ticker.trim() === '') {
    errors.push('Ticker is required');
  }
  
  if (typeof rateData.buyPrice !== 'number' || rateData.buyPrice <= 0) {
    errors.push('Buy price must be a positive number');
  }
  
  if (typeof rateData.sellPrice !== 'number' || rateData.sellPrice <= 0) {
    errors.push('Sell price must be a positive number');
  }
  
  if (rateData.buyPrice >= rateData.sellPrice) {
    errors.push('Sell price must be greater than buy price');
  }
  
  // Check for reasonable spread (not more than 50%)
  const spread = rateData.sellPrice - rateData.buyPrice;
  const spreadPercentage = (spread / rateData.buyPrice) * 100;
  
  if (spreadPercentage > 50) {
    errors.push('Spread is unusually large (>50%)');
  }
  
  return errors;
}
```

### Competitor Analysis Queries
```typescript
export const getCompetitorsWithRates = query({
  args: {
    clerkOrganizationId: v.string(),
    activeOnly: v.optional(v.boolean()),
    includeBroken: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("org_competitors")
      .withIndex("by_clerk_org_id", (q) => 
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      );
    
    // Apply filters
    if (args.activeOnly) {
      query = query.filter((q) => q.eq(q.field("scrapingActive"), true));
    }
    
    const competitors = await query.collect();
    
    // Get latest rates for each competitor
    const enrichedCompetitors = await Promise.all(
      competitors.map(async (competitor) => {
        const latestRates = await ctx.db
          .query("org_competitor_rates")
          .withIndex("by_competitor_id", (q) => q.eq("competitorId", competitor._id))
          .order("desc")
          .limit(50) // Get recent rates
          .collect();
        
        // Group rates by ticker and get latest for each
        const ratesByTicker = latestRates.reduce((acc, rate) => {
          if (!acc[rate.ticker] || rate.createdAt > acc[rate.ticker].createdAt) {
            acc[rate.ticker] = rate;
          }
          return acc;
        }, {} as Record<string, any>);
        
        const latestRatesArray = Object.values(ratesByTicker);
        
        // Filter out broken if requested
        const filteredRates = args.includeBroken 
          ? latestRatesArray 
          : latestRatesArray.filter(rate => !rate.broken);
        
        // Get recent flags
        const recentFlags = await ctx.db
          .query("org_competitor_flags")
          .withIndex("by_competitor_id", (q) => q.eq("competitorId", competitor._id))
          .filter((q) => q.eq(q.field("status"), "ACTIVE"))
          .collect();
        
        return {
          ...competitor,
          rates: filteredRates.map(rate => ({
            id: rate._id,
            ticker: rate.ticker,
            buyPrice: rate.buyPrice,
            sellPrice: rate.sellPrice,
            spread: rate.spread,
            broken: rate.broken,
            validated: rate.validated,
            createdAt: rate.createdAt,
            updatedAt: rate.updatedAt,
          })),
          statistics: {
            totalRates: latestRatesArray.length,
            validRates: filteredRates.length,
            brokenRates: latestRatesArray.filter(r => r.broken).length,
            activeFlags: recentFlags.length,
            lastScrape: competitor.lastScrapeAt,
            successRate: competitor.totalScrapes > 0 
              ? ((competitor.totalScrapes - competitor.failedScrapes) / competitor.totalScrapes * 100).toFixed(1)
              : "0.0",
          },
          flags: recentFlags.map(flag => ({
            id: flag._id,
            flagType: flag.flagType,
            severity: flag.severity,
            title: flag.title,
            description: flag.description,
            createdAt: flag.createdAt,
          })),
        };
      })
    );
    
    return enrichedCompetitors;
  },
});

export const getCompetitorAnalysis = query({
  args: {
    clerkOrganizationId: v.string(),
    ticker: v.string(),
    timeRange: v.optional(v.string()), // "24h" | "7d" | "30d"
  },
  handler: async (ctx, args) => {
    // Get all competitor rates for the specified ticker
    const timeRangeMs = args.timeRange === "24h" ? 24 * 60 * 60 * 1000 :
                       args.timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000 :
                       args.timeRange === "30d" ? 30 * 24 * 60 * 60 * 1000 :
                       24 * 60 * 60 * 1000; // Default to 24h
    
    const cutoffTime = Date.now() - timeRangeMs;
    
    const rates = await ctx.db
      .query("org_competitor_rates")
      .withIndex("by_ticker", (q) => q.eq("ticker", args.ticker))
      .filter((q) => q.gte(q.field("createdAt"), cutoffTime))
      .collect();
    
    // Get competitor details
    const competitorIds = [...new Set(rates.map(r => r.competitorId))];
    const competitors = await Promise.all(
      competitorIds.map(id => ctx.db.get(id))
    );
    
    // Analyze rates by competitor
    const analysis = rates.reduce((acc, rate) => {
      const competitor = competitors.find(c => c?._id === rate.competitorId);
      if (!competitor) return acc;
      
      if (!acc[rate.competitorId]) {
        acc[rate.competitorId] = {
          competitor: competitor,
          rates: [],
          statistics: {
            count: 0,
            avgBuyPrice: 0,
            avgSellPrice: 0,
            minBuyPrice: rate.buyPrice,
            maxBuyPrice: rate.buyPrice,
            minSellPrice: rate.sellPrice,
            maxSellPrice: rate.sellPrice,
            avgSpread: 0,
          }
        };
      }
      
      const analysis = acc[rate.competitorId];
      analysis.rates.push(rate);
      analysis.statistics.count++;
      
      // Update min/max
      analysis.statistics.minBuyPrice = Math.min(analysis.statistics.minBuyPrice, rate.buyPrice);
      analysis.statistics.maxBuyPrice = Math.max(analysis.statistics.maxBuyPrice, rate.buyPrice);
      analysis.statistics.minSellPrice = Math.min(analysis.statistics.minSellPrice, rate.sellPrice);
      analysis.statistics.maxSellPrice = Math.max(analysis.statistics.maxSellPrice, rate.sellPrice);
      
      return acc;
    }, {} as Record<string, any>);
    
    // Calculate averages for each competitor
    Object.values(analysis).forEach((competitorAnalysis: any) => {
      const rates = competitorAnalysis.rates;
      const stats = competitorAnalysis.statistics;
      
      stats.avgBuyPrice = rates.reduce((sum: number, rate: any) => sum + rate.buyPrice, 0) / rates.length;
      stats.avgSellPrice = rates.reduce((sum: number, rate: any) => sum + rate.sellPrice, 0) / rates.length;
      stats.avgSpread = stats.avgSellPrice - stats.avgBuyPrice;
      
      // Round values
      stats.avgBuyPrice = Math.round(stats.avgBuyPrice * 10000) / 10000;
      stats.avgSellPrice = Math.round(stats.avgSellPrice * 10000) / 10000;
      stats.avgSpread = Math.round(stats.avgSpread * 10000) / 10000;
    });
    
    // Calculate market averages
    const allRates = Object.values(analysis).flatMap((c: any) => c.rates);
    const marketStats = {
      totalCompetitors: Object.keys(analysis).length,
      totalRates: allRates.length,
      avgBuyPrice: allRates.length > 0 ? Math.round((allRates.reduce((sum: number, rate: any) => sum + rate.buyPrice, 0) / allRates.length) * 10000) / 10000 : 0,
      avgSellPrice: allRates.length > 0 ? Math.round((allRates.reduce((sum: number, rate: any) => sum + rate.sellPrice, 0) / allRates.length) * 10000) / 10000 : 0,
      bestBuyPrice: Math.min(...allRates.map((r: any) => r.buyPrice)),
      bestSellPrice: Math.max(...allRates.map((r: any) => r.sellPrice)),
    };
    
    if (marketStats.avgSellPrice > 0 && marketStats.avgBuyPrice > 0) {
      marketStats.avgSpread = marketStats.avgSellPrice - marketStats.avgBuyPrice;
    }
    
    return {
      ticker: args.ticker,
      timeRange: args.timeRange || "24h",
      marketStats,
      competitors: Object.values(analysis),
    };
  },
});
```

### Scraping Management
```typescript
export const enqueueCompetitorScraping = mutation({
  args: {
    clerkOrganizationId: v.string(),
    competitorIds: v.optional(v.array(v.id("org_competitors"))), // Specific competitors or all active
    priority: v.optional(v.string()), // "HIGH" | "NORMAL" | "LOW"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // Get competitors to scrape
    let competitors;
    if (args.competitorIds && args.competitorIds.length > 0) {
      competitors = await Promise.all(
        args.competitorIds.map(id => ctx.db.get(id))
      );
    } else {
      competitors = await ctx.db
        .query("org_competitors")
        .withIndex("by_clerk_org_id", (q) => 
          q.eq("clerkOrganizationId", args.clerkOrganizationId)
        )
        .filter((q) => q.eq(q.field("scrapingActive"), true))
        .collect();
    }
    
    // Filter out null competitors
    const validCompetitors = competitors.filter(c => c !== null);
    
    if (validCompetitors.length === 0) {
      return { success: false, message: "No active competitors found" };
    }
    
    // Enqueue scraping jobs (in a real implementation, this would use a job queue)
    // For now, we'll simulate by creating scraping logs
    const sessionId = `scrape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    for (const competitor of validCompetitors) {
      await ctx.db.insert("org_competitor_scraping_logs", {
        clerkOrganizationId: args.clerkOrganizationId,
        competitorId: competitor._id,
        sessionId: sessionId,
        startTime: Date.now(),
        status: "QUEUED",
        ratesCollected: 0,
        ratesValidated: 0,
        ratesRejected: 0,
        requestsMade: 0,
        createdAt: Date.now(),
      });
    }
    
    // Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: args.clerkOrganizationId,
      userId: identity.subject,
      sessionId: null,
      event: "COMPETITOR_SCRAPING_ENQUEUED",
      referenceId: null,
      comment: `Enqueued scraping for ${validCompetitors.length} competitors`,
      meta: {
        sessionId: sessionId,
        competitorCount: validCompetitors.length,
        competitorIds: validCompetitors.map(c => c._id),
        priority: args.priority || "NORMAL",
      },
      createdAt: Date.now(),
    });
    
    return {
      success: true,
      message: `Scraping enqueued for ${validCompetitors.length} competitors`,
      sessionId: sessionId,
      competitorCount: validCompetitors.length,
    };
  },
});
```

## Error Handling

### Validation Errors
- **Competitor Exists**: "Competitor with this key already exists"
- **Invalid Endpoint**: "Invalid scraping endpoint URL"
- **Invalid Rate Data**: "Rate data failed validation"
- **Scraping Failed**: "Failed to scrape competitor rates"
- **Unauthorized**: "User is not authorized to manage competitors"

### System Errors
- **Database Error**: "An error occurred while storing competitor data"
- **Network Error**: "Failed to connect to competitor website"
- **Parsing Error**: "Failed to parse competitor rate data"
- **Job Queue Error**: "Failed to enqueue scraping job"

## User Interface Requirements

### Competitor Management
1. **Competitor Dashboard**: Overview of all competitors with status and statistics
2. **Competitor Creation**: Add new competitors with scraping configuration
3. **Rate Monitoring**: Real-time rate display with comparison charts
4. **Scraping Control**: Start/stop scraping and configure intervals
5. **Issue Management**: View and resolve scraping flags and errors

### Rate Analysis
1. **Price Comparison**: Side-by-side competitor rate comparisons
2. **Market Analysis**: Market averages and best/worst rates
3. **Historical Trends**: Rate history charts and trend analysis
4. **Spread Analysis**: Buy/sell spread analysis across competitors
5. **Anomaly Detection**: Identify unusual rate patterns

### Configuration
1. **Scraping Settings**: Configure endpoints, intervals, and methods
2. **Rate Validation**: Set validation rules and thresholds
3. **Competitor Weighting**: Configure weights for market averaging
4. **Alert Settings**: Configure notifications for scraping issues

## Integration Points

### Components Using Competitor System
1. **Rate Engine**: Use competitor rates for pricing decisions
2. **Analytics Dashboard**: Display competitive intelligence
3. **Reporting**: Generate competitor analysis reports
4. **Alert System**: Notify about scraping issues and rate anomalies
5. **Admin Panel**: Configure and manage competitor monitoring

### Shared Functions
- `getCompetitorsWithRates()` for competitor listings
- `collectCompetitorRates()` for rate collection
- `getCompetitorAnalysis()` for market analysis
- `enqueueCompetitorScraping()` for scraping management

## Testing Requirements

### Unit Tests
- Test competitor creation and validation
- Test rate data validation and storage
- Test scraping log creation
- Test competitor statistics calculation
- Test flag creation and management
- Test rate analysis calculations

### Integration Tests
- Test complete scraping workflow
- Test rate collection and validation
- Test competitor analysis and reporting
- Test error handling and recovery
- Test configuration management

### Edge Cases
- Invalid competitor endpoints
- Malformed rate data
- Scraping timeouts and failures
- Competitor website changes
- Rate anomaly detection

## Security Considerations

### Authorization
- Verify user has competitor management permissions
- Validate user belongs to organization
- Protect scraping configuration from unauthorized access
- Audit trail for all competitor modifications

### Data Privacy
- Respect competitor website terms of service
- Proper rate limiting for scraping
- Secure storage of competitor data
- Compliance with data collection regulations

## Performance Considerations

### Scraping Optimization
- Efficient rate limiting and request scheduling
- Parallel scraping for multiple competitors
- Caching of rate data to reduce database load
- Optimized HTML parsing and data extraction

### Database Queries
- Efficient indexing on competitor keys and tickers
- Optimized rate history queries with proper pagination
- Competitor statistics caching for dashboard performance
- Rate data archiving for long-term storage

## Migration Notes

### Legacy to MetaCX Differences
1. **Authentication**: Rails uses token auth vs MetaCX uses Clerk JWT
2. **Job Queue**: Legacy uses Sidekiq vs MetaCX uses Convex scheduled functions
3. **Scraping**: Legacy uses Nokogiri vs MetaCX uses modern HTTP clients
4. **Database**: Rails PostgreSQL vs MetaCX Convex

### Preserved Legacy Logic
- Competitor data structure and relationships
- Rate validation and quality checks
- Scraping error handling and flagging
- Market analysis and averaging calculations
- Competitor status management
- Rate anomaly detection

## Future Enhancements

### Potential Improvements
1. **AI-powered Scraping**: Machine learning for adaptive scraping
2. **Real-time Alerts**: WebSocket-based real-time rate updates
3. **Advanced Analytics**: Enhanced competitor behavior analysis
4. **Mobile Interface**: Optimized mobile competitor monitoring
5. **API Integration**: Direct API connections for major competitors
6. **Predictive Analysis**: AI-powered rate trend prediction

### Analytics
- Track competitor pricing patterns
- Monitor market share and positioning
- Report on scraping performance and reliability
- User behavior analysis for competitor data usage
- Revenue analysis based on competitive intelligence
