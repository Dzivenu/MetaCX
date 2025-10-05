

  create_table "activities", force: :cascade do |t|
    t.bigint "branch_id", null: false
    t.string "typeof", null: false
    t.bigint "user_id", null: false
    t.bigint "session_id"
    t.string "event", null: false
    t.string "comment"
    t.json "meta"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "reference_id"
    t.index ["branch_id"], name: "index_activities_on_branch_id"
    t.index ["event"], name: "index_activities_on_event"
    t.index ["session_id"], name: "index_activities_on_session_id"
    t.index ["typeof"], name: "index_activities_on_typeof"
    t.index ["user_id"], name: "index_activities_on_user_id"
  end

  create_table "addresses", force: :cascade do |t|
    t.integer "door"
    t.integer "office"
    t.string "street"
    t.string "city"
    t.string "state"
    t.string "country"
    t.string "postal_code"
    t.string "typeof"
    t.boolean "blacklisted"
    t.string "locatable_type"
    t.bigint "locatable_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "primary", default: false
    t.string "building_number"
    t.string "district"
    t.string "locality"
    t.string "province_code"
    t.string "country_code"
    t.boolean "active", default: true
    t.string "address_full"
    t.index ["locatable_type", "locatable_id"], name: "index_addresses_on_locatable_type_and_locatable_id"
  end

  create_table "beneficiaries", force: :cascade do |t|
    t.string "first_name"
    t.string "last_name"
    t.string "occupation"
    t.datetime "birth_date"
    t.bigint "order_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "kyc_type"
    t.bigint "kyc_id"
    t.bigint "customer_id"
    t.index ["customer_id"], name: "index_beneficiaries_on_customer_id"
    t.index ["kyc_type", "kyc_id"], name: "index_beneficiaries_on_kyc_type_and_kyc_id"
    t.index ["order_id"], name: "index_beneficiaries_on_order_id"
  end

  create_table "blacklisted_entities", force: :cascade do |t|
    t.integer "atf_id"
    t.string "name"
    t.text "info"
    t.string "basis"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "blacklisted_individuals", force: :cascade do |t|
    t.integer "atf_id"
    t.string "last_name"
    t.string "first_name"
    t.string "second_name"
    t.string "third_name"
    t.string "fourth_name"
    t.string "place_of_birth"
    t.string "place_of_birth_alt"
    t.string "dob"
    t.string "nationality"
    t.text "info"
    t.string "basis"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "full_name"
    t.datetime "date_of_birth"
    t.string "alias_name"
    t.string "reference_name"
    t.string "reference_id"
    t.string "entity_name"
    t.string "schedule"
    t.string "unique_key", null: false
    t.boolean "is_individual", null: false
    t.boolean "active", default: true
    t.string "reference_source"
    t.string "document_type_2"
    t.string "dataid"
    t.string "un_list_type"
    t.text "name_original_script"
    t.text "comments"
    t.string "title"
    t.string "designation"
    t.string "list_type"
    t.date "last_day_updated"
    t.string "city_of_birth"
    t.string "country_of_birth"
    t.string "address_country"
    t.string "address_street"
    t.string "address_city"
    t.string "address_state_province"
    t.string "address_zip_code"
    t.text "address_note"
    t.date "birth_date"
    t.string "document_type"
    t.string "document_number"
    t.string "document_country_of_issue"
    t.text "document_note"
    t.date "document_date_of_issue"
    t.string "document_city_of_issue"
    t.string "gender"
    t.index ["alias_name"], name: "index_blacklisted_individuals_on_alias_name"
    t.index ["full_name"], name: "index_blacklisted_individuals_on_full_name"
    t.index ["unique_key"], name: "index_blacklisted_individuals_on_unique_key", unique: true
  end

  create_table "blacklisted_individuals_sources", force: :cascade do |t|
    t.string "html"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "count"
  end

  create_table "blacklisted_wallets", force: :cascade do |t|
    t.string "address", default: ""
    t.string "blockchain", default: ""
    t.text "reason"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["address"], name: "index_blacklisted_wallets_on_address", unique: true
  end

  create_table "blazer_audits", force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "query_id"
    t.text "statement"
    t.string "data_source"
    t.datetime "created_at"
    t.index ["query_id"], name: "index_blazer_audits_on_query_id"
    t.index ["user_id"], name: "index_blazer_audits_on_user_id"
  end

  create_table "blazer_checks", force: :cascade do |t|
    t.bigint "creator_id"
    t.bigint "query_id"
    t.string "state"
    t.string "schedule"
    t.text "emails"
    t.text "slack_channels"
    t.string "check_type"
    t.text "message"
    t.datetime "last_run_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["creator_id"], name: "index_blazer_checks_on_creator_id"
    t.index ["query_id"], name: "index_blazer_checks_on_query_id"
  end

  create_table "blazer_dashboard_queries", force: :cascade do |t|
    t.bigint "dashboard_id"
    t.bigint "query_id"
    t.integer "position"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["dashboard_id"], name: "index_blazer_dashboard_queries_on_dashboard_id"
    t.index ["query_id"], name: "index_blazer_dashboard_queries_on_query_id"
  end

  create_table "blazer_dashboards", force: :cascade do |t|
    t.bigint "creator_id"
    t.text "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["creator_id"], name: "index_blazer_dashboards_on_creator_id"
  end

  create_table "blazer_queries", force: :cascade do |t|
    t.bigint "creator_id"
    t.string "name"
    t.text "description"
    t.text "statement"
    t.string "data_source"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["creator_id"], name: "index_blazer_queries_on_creator_id"
  end



  create_table "cash_flows", force: :cascade do |t|
    t.float "inbound", default: 0.0
    t.float "outbound", default: 0.0
    t.string "ticker"
    t.bigint "session_id"
    t.bigint "currency_id"
    t.bigint "branch_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.float "spot", default: 0.0
    t.float "open_count", default: 0.0
    t.float "close_count", default: 0.0
    t.bigint "repository_id"
    t.float "current_spread", default: 0.0
    t.float "average_spread", default: 0.0
    t.float "closing_spread", default: 0.0
    t.float "open_spread", default: 0.0
    t.float "historical_spread", default: [], array: true
    t.index ["branch_id"], name: "index_cash_flows_on_branch_id"
    t.index ["currency_id"], name: "index_cash_flows_on_currency_id"
    t.index ["repository_id"], name: "index_cash_flows_on_repository_id"
    t.index ["session_id"], name: "index_cash_flows_on_session_id"
  end

  create_table "competitor_rates", force: :cascade do |t|
    t.string "company"
    t.float "buy_price", default: [], array: true
    t.float "sell_price", default: [], array: true
    t.boolean "broken", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "key"
    t.string "ticker"
    t.string "address"
    t.string "website"
    t.string "scrape_endpoint"
  end

  create_table "competitors", force: :cascade do |t|
    t.string "key"
    t.string "name"
    t.string "website"
    t.text "location_address"
    t.boolean "scraping_active"
    t.string "scraping_endpoint"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["key"], name: "index_competitors_on_key", unique: true
    t.index ["name"], name: "index_competitors_on_name", unique: true
  end

  create_table "compliance_rulesets", force: :cascade do |t|
    t.string "name", null: false
    t.bigint "user_id"
    t.text "description"
    t.boolean "active", default: true
    t.jsonb "ruleset", default: []
    t.string "duration"
    t.string "direction"
    t.jsonb "currencies", default: []
    t.jsonb "customer_countries", default: []
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_compliance_rulesets_on_active"
    t.index ["name"], name: "index_compliance_rulesets_on_name"
    t.index ["user_id"], name: "index_compliance_rulesets_on_user_id"
  end

  create_table "contacts", force: :cascade do |t|
    t.string "typeof"
    t.string "endpoint"
    t.boolean "blacklisted"
    t.string "contactable_type"
    t.bigint "contactable_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "marketable"
    t.datetime "marketable_accept_at"
    t.boolean "promoted", default: false
    t.boolean "primary", default: false
    t.boolean "verified", default: false
    t.string "extension"
    t.boolean "active", default: true
    t.datetime "verified_at"
    t.index ["contactable_type", "contactable_id"], name: "index_contacts_on_contactable_type_and_contactable_id"
  end

  create_table "crypto_fx_rates", force: :cascade do |t|
    t.string "exchange_name"
    t.string "currency_name"
    t.string "ticker"
    t.float "fx_rate", default: [], array: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "session_id"
    t.index ["session_id"], name: "index_crypto_fx_rates_on_session_id"
  end



  create_table "currency_swaps", force: :cascade do |t|
    t.json "inbound"
    t.json "outbound"
    t.bigint "currency_id"
    t.bigint "session_id"
    t.bigint "repository_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.float "swap_value", default: 0.0
    t.string "status"
    t.bigint "user_id"
    t.string "inbound_ticker"
    t.string "outbound_ticker"
    t.bigint "inbound_repository_id"
    t.bigint "outbound_repository_id"
    t.float "inbound_sum"
    t.float "outbound_sum"
    t.index ["currency_id"], name: "index_currency_swaps_on_currency_id"
    t.index ["repository_id"], name: "index_currency_swaps_on_repository_id"
    t.index ["session_id"], name: "index_currency_swaps_on_session_id"
    t.index ["user_id"], name: "index_currency_swaps_on_user_id"
  end

  create_table "customers", force: :cascade do |t|
    t.string "first_name"
    t.string "last_name"
    t.date "dob"
    t.string "occupation"
    t.text "info"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "scan_success", default: false
    t.string "scan_raw_data"
    t.string "telephone"
    t.string "email"
    t.boolean "blacklisted", default: false
    t.boolean "duplicate", default: false
    t.boolean "active", default: true
    t.bigint "merged_id"
    t.string "employer"
    t.integer "orders_between_1k_to_9k", default: 0
    t.integer "orders_between_9k_to_10k", default: 0
    t.bigint "last_order_id", default: 0
    t.boolean "suspicious_order"
    t.bigint "previous_ids", default: [], array: true
    t.bigint "marketable_contact_ids", default: [], array: true
    t.bigint "primary_phone_id"
    t.bigint "primary_email_id"
    t.bigint "primary_address_id"
    t.bigint "primary_identification_id"
    t.decimal "risk_score"
    t.datetime "last_order_at"
    t.integer "orders_over_10k"
    t.string "blacklist_reason"
    t.index ["first_name"], name: "index_customers_on_first_name"
    t.index ["last_name"], name: "index_customers_on_last_name"
    t.index ["merged_id"], name: "index_customers_on_merged_id"
    t.index ["risk_score"], name: "index_customers_on_risk_score"
  end

  create_table "data_export_templates", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.jsonb "filters", default: {}
    t.jsonb "selected_fields", default: {}
    t.bigint "user_id", null: false
    t.string "type", default: "orders", null: false
    t.boolean "active", default: true
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["active"], name: "index_data_export_templates_on_active"
    t.index ["name"], name: "index_data_export_templates_on_name"
    t.index ["type"], name: "index_data_export_templates_on_type"
    t.index ["user_id"], name: "index_data_export_templates_on_user_id"
  end

  create_table "debit_and_deposits", force: :cascade do |t|
    t.string "ticker"
    t.float "sum"
    t.datetime "open_at"
    t.datetime "close_at"
    t.string "status"
    t.integer "inbound_repository_id"
    t.integer "outbound_repository_id"
    t.bigint "session_id"
    t.bigint "currency_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["currency_id"], name: "index_debit_and_deposits_on_currency_id"
    t.index ["open_at"], name: "index_debit_and_deposits_on_open_at"
    t.index ["session_id"], name: "index_debit_and_deposits_on_session_id"
    t.index ["status"], name: "index_debit_and_deposits_on_status"
    t.index ["user_id"], name: "index_debit_and_deposits_on_user_id"
  end

  create_table "expenses", force: :cascade do |t|
    t.string "name"
    t.string "ticker"
    t.float "sum"
    t.string "photo"
    t.datetime "open_at"
    t.datetime "close_at"
    t.bigint "session_id"
    t.bigint "currency_id"
    t.string "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "typeof"
    t.bigint "user_id"
    t.float "fx_rate"
    t.float "sum_in_cad"
    t.integer "sale_id", default: 0
    t.datetime "cancel_at"
    t.bigint "inbound_repository_id"
    t.string "inbound_ticker"
    t.string "outbound_ticker"
    t.float "inbound_sum"
    t.float "outbound_sum"
    t.bigint "outbound_repository_id"
    t.bigint "previous_repository_id"
    t.index ["currency_id"], name: "index_expenses_on_currency_id"
    t.index ["session_id"], name: "index_expenses_on_session_id"
    t.index ["status"], name: "index_expenses_on_status"
    t.index ["user_id"], name: "index_expenses_on_user_id"
  end

  create_table "fintrac", force: :cascade do |t|
    t.string "report_key", null: false
    t.integer "session_id", null: false
    t.integer "order_ids", default: [], null: false, array: true
    t.float "cad_value", default: 0.0
    t.string "report_typeof", null: false
    t.boolean "is_incomplete", default: false
    t.boolean "is_submitted", default: false
    t.integer "customer_id", null: false
    t.integer "teller_id", null: false
    t.datetime "session_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cad_value"], name: "index_fintrac_on_cad_value"
    t.index ["customer_id"], name: "index_fintrac_on_customer_id"
    t.index ["is_incomplete"], name: "index_fintrac_on_is_incomplete"
    t.index ["is_submitted"], name: "index_fintrac_on_is_submitted"
    t.index ["report_key"], name: "index_fintrac_on_report_key", unique: true
    t.index ["report_typeof"], name: "index_fintrac_on_report_typeof"
    t.index ["session_date"], name: "index_fintrac_on_session_date"
    t.index ["session_id"], name: "index_fintrac_on_session_id"
    t.index ["teller_id"], name: "index_fintrac_on_teller_id"
  end

  create_table "flags", force: :cascade do |t|
    t.string "name"
    t.integer "priority", default: 0
    t.boolean "reviewed", default: false
    t.datetime "review_at"
    t.string "flagable_type"
    t.bigint "flagable_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "session_id"
    t.integer "due"
    t.string "status", default: "pending"
    t.string "comment", default: "No comments."
    t.string "teller_name"
    t.string "reviewer_name"
    t.boolean "overdue", default: false
    t.date "deadline"
    t.bigint "reviewer_id"
    t.bigint "teller_id"
    t.string "category"
    t.string "key"
    t.bigint "customer_id"
    t.boolean "blocking", default: false
    t.string "parent_status", default: "ACTIVE"
    t.string "subject_name"
    t.string "external"
    t.index ["customer_id"], name: "index_flags_on_customer_id"
    t.index ["flagable_type", "flagable_id"], name: "index_flags_on_flagable_type_and_flagable_id"
    t.index ["key"], name: "index_flags_on_key", unique: true
    t.index ["reviewed"], name: "index_flags_on_reviewed"
    t.index ["reviewer_id"], name: "index_flags_on_reviewer_id"
    t.index ["session_id"], name: "index_flags_on_session_id"
    t.index ["teller_id"], name: "index_flags_on_teller_id"
  end

  create_table "float_snapshots", force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "session_id"
    t.string "source_model_type", null: false
    t.bigint "source_model_id", null: false
    t.float "inbound_repository_balance_before"
    t.float "inbound_repository_balance_after"
    t.json "inbound_repository_float_stacks_before"
    t.json "inbound_repository_float_stacks_after"
    t.string "status", default: "COMMITTED", null: false
    t.float "inbound_sum"
    t.float "outbound_sum"
    t.bigint "inbound_repository_id"
    t.bigint "outbound_repository_id"
    t.string "inbound_ticker"
    t.string "outbound_ticker"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.float "outbound_repository_balance_before"
    t.float "outbound_repository_balance_after"
    t.json "outbound_repository_float_stacks_before"
    t.json "outbound_repository_float_stacks_after"
    t.index ["inbound_repository_id"], name: "index_float_snapshots_on_inbound_repository_id"
    t.index ["outbound_repository_id"], name: "index_float_snapshots_on_outbound_repository_id"
    t.index ["session_id", "source_model_type", "source_model_id", "status"], name: "index_float_snapshots_on_session_source_and_status", unique: true
    t.index ["session_id"], name: "index_float_snapshots_on_session_id"
    t.index ["source_model_type", "source_model_id"], name: "index_float_snapshots_on_source_model_type_and_source_model_id"
    t.index ["status"], name: "index_float_snapshots_on_status"
    t.index ["user_id"], name: "index_float_snapshots_on_user_id"
  end

  create_table "float_stack_changes", force: :cascade do |t|
    t.string "action_source", null: false
    t.bigint "action_source_id"
    t.string "change_direction", null: false
    t.decimal "change_count", precision: 18, scale: 8, null: false
    t.bigint "repository_id"
    t.bigint "denomination_id"
    t.bigint "session_id"
    t.bigint "user_id"
    t.decimal "total_count_before", precision: 18, scale: 8, null: false
    t.decimal "total_count_after", precision: 18, scale: 8, null: false
    t.datetime "occurred_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.decimal "open_count", precision: 18, scale: 8
    t.decimal "previous_transferred_during_session_count", precision: 18, scale: 8
    t.decimal "post_transferred_during_session_count", precision: 18, scale: 8
    t.decimal "previous_spent_during_session_count", precision: 18, scale: 8
    t.decimal "post_spent_during_session_count", precision: 18, scale: 8
    t.string "status", default: "COMMITTED"
    t.index ["denomination_id"], name: "index_float_stack_changes_on_denomination_id"
    t.index ["occurred_at"], name: "idx_ftc_occurred_at"
    t.index ["repository_id"], name: "index_float_stack_changes_on_repository_id"
    t.index ["session_id"], name: "index_float_stack_changes_on_session_id"
    t.index ["status"], name: "index_float_stack_changes_on_status"
    t.index ["user_id"], name: "index_float_stack_changes_on_user_id"
  end


  create_table "float_transfers", force: :cascade do |t|
    t.float "value"
    t.bigint "session_id"
    t.bigint "from_id", null: false
    t.bigint "to_id", null: false
    t.string "ticker"
    t.json "breakdown", default: [], array: true
    t.datetime "created_at"
    t.datetime "updated_at"
    t.bigint "repository_id"
    t.string "status"
    t.bigint "user_id"
    t.string "inbound_ticker"
    t.string "outbound_ticker"
    t.bigint "inbound_repository_id"
    t.bigint "outbound_repository_id"
    t.float "inbound_sum"
    t.float "outbound_sum"
    t.index ["from_id"], name: "index_float_transfers_on_from_id"
    t.index ["repository_id"], name: "index_float_transfers_on_repository_id"
    t.index ["session_id"], name: "index_float_transfers_on_session_id"
    t.index ["to_id"], name: "index_float_transfers_on_to_id"
    t.index ["user_id"], name: "index_float_transfers_on_user_id"
  end

  create_table "global_settings_groups", force: :cascade do |t|
    t.boolean "tx_breakdown_required", default: true
    t.boolean "midday_recount_enabled", default: false
    t.string "base_currency"
    t.boolean "crypto_enabled", default: true
    t.bigint "branch_id"
    t.index ["branch_id"], name: "index_global_settings_groups_on_branch_id"
  end

  create_table "identifications", force: :cascade do |t|
    t.string "typeof"
    t.string "reference"
    t.date "dob"
    t.string "issuing_country"
    t.date "expiration_date"
    t.string "photo"
    t.datetime "verified_at"
    t.bigint "customer_id"
    t.integer "reviewer_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "order_id"
    t.text "origin_of_funds"
    t.text "purpose_of_funds"
    t.string "description"
    t.boolean "primary", default: false
    t.string "type_code"
    t.string "country_code"
    t.string "province_code"
    t.string "province_other"
    t.boolean "active", default: true
    t.index ["customer_id"], name: "index_identifications_on_customer_id"
  end

  create_table "infos", force: :cascade do |t|
    t.text "comment"
    t.string "infoable_type"
    t.bigint "infoable_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "body"
    t.bigint "session_id"
    t.string "user"
    t.integer "user_id"
    t.index ["infoable_type", "infoable_id"], name: "index_infos_on_infoable_type_and_infoable_id"
    t.index ["session_id"], name: "index_infos_on_session_id"
  end


  create_table "invoices", force: :cascade do |t|
    t.bigint "order_id"
    t.integer "status"
    t.string "btc_pay_invoice_id"
    t.json "transactions", default: [], array: true
    t.string "payment_link"
    t.integer "expiration_time"
    t.integer "created_time"
    t.float "fee"
    t.string "receiving_address"
    t.float "paid", default: 0.0
    t.float "due"
    t.float "amount"
    t.float "overpayment", default: 0.0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_invoices_on_order_id"
  end

  create_table "marketings", force: :cascade do |t|
    t.string "channel"
    t.string "value"
    t.bigint "customer_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "source"
    t.text "details"
    t.index ["channel"], name: "index_marketings_on_channel"
    t.index ["customer_id"], name: "index_marketings_on_customer_id"
  end

  create_table "notes", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "title"
    t.bigint "user_id"
    t.bigint "customer_id"
    t.string "key"
    t.bigint "session_id"
    t.boolean "resolved", default: false
    t.index ["customer_id"], name: "index_notes_on_customer_id"
    t.index ["key"], name: "index_notes_on_key", unique: true
    t.index ["resolved"], name: "index_notes_on_resolved"
    t.index ["user_id"], name: "index_notes_on_user_id"
  end

  create_table "orders", force: :cascade do |t|
    t.float "inbound_sum"
    t.integer "inbound_currency_id"
    t.string "inbound_ticker"
    t.string "inbound_type"
    t.string "inbound_fund_source"
    t.integer "outbound_currency_id"
    t.float "outbound_sum"
    t.string "outbound_ticker"
    t.string "outbound_type"
    t.float "margin"
    t.integer "margin_discount"
    t.float "fee"
    t.string "status"
    t.datetime "open_at"
    t.datetime "close_at"
    t.integer "nominee_id"
    t.bigint "customer_id"
    t.bigint "session_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "signature_data_uri"
    t.float "fx_reserve_variation", default: 0.0, null: false
    t.float "fx_reserve_booked_gol", default: 0.0, null: false
    t.float "fx_rate"
    t.integer "inbound_repository_id"
    t.integer "outbound_repository_id"
    t.string "inbound_crypto_address"
    t.string "outbound_crypto_address"
    t.string "quote_source"
    t.bigint "user_id"
    t.bigint "identification_id"
    t.decimal "tx_fees"
    t.string "crm_status"
    t.datetime "activation_date"
    t.datetime "scheduled_date"
    t.datetime "expiration_date"
    t.string "quote_source_data"
    t.integer "quote_source_user_id"
    t.string "transaction_specification"
    t.string "transaction_specification_data"
    t.string "crypto_tx_type"
    t.string "purpose_of_funds"
    t.string "source_of_funds"
    t.integer "batched_status", default: 0
    t.string "tx_id"
    t.float "network_fee", default: 0.0
    t.string "tx_ids"
    t.decimal "ssgl_cad_value"
    t.decimal "value_in_other_currency"
    t.decimal "value_in_cad"
    t.integer "beneficiary_id"
    t.boolean "suspicious"
    t.integer "crypto_payment_attempt_count"
    t.string "btc_fee_rate"
    t.integer "beneficiary_customer_id"
    t.bigint "customer_address_id"
    t.bigint "customer_identification_id"
    t.bigint "customer_phone_contact_id"
    t.bigint "customer_email_contact_id"
    t.boolean "customer_review_msg_sent", default: false
    t.float "rate_wo_fees", default: 0.0
    t.float "final_rate", default: 0.0
    t.float "final_rate_without_fees", default: 0.0
    t.index ["customer_address_id"], name: "index_orders_on_customer_address_id"
    t.index ["customer_email_contact_id"], name: "index_orders_on_customer_email_contact_id"
    t.index ["customer_id"], name: "index_orders_on_customer_id"
    t.index ["customer_identification_id"], name: "index_orders_on_customer_identification_id"
    t.index ["customer_phone_contact_id"], name: "index_orders_on_customer_phone_contact_id"
    t.index ["identification_id"], name: "index_orders_on_identification_id"
    t.index ["inbound_repository_id"], name: "index_orders_on_inbound_repository_id"
    t.index ["inbound_sum"], name: "index_orders_on_inbound_sum"
    t.index ["open_at"], name: "index_orders_on_open_at"
    t.index ["outbound_repository_id"], name: "index_orders_on_outbound_repository_id"
    t.index ["outbound_sum"], name: "index_orders_on_outbound_sum"
    t.index ["session_id"], name: "index_orders_on_session_id"
    t.index ["status"], name: "index_orders_on_status"
    t.index ["user_id"], name: "index_orders_on_user_id"
  end

  create_table "receipts", force: :cascade do |t|
    t.datetime "print_at"
    t.boolean "printed", default: false
    t.bigint "session_id"
    t.bigint "order_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "body"
    t.index ["order_id"], name: "index_receipts_on_order_id"
    t.index ["print_at"], name: "index_receipts_on_print_at"
    t.index ["session_id"], name: "index_receipts_on_session_id"
  end

  create_table "reports", force: :cascade do |t|
    t.float "off_balance", default: 0.0
    t.float "profit", default: 0.0
    t.float "vol_btc_in", default: 0.0
    t.float "vol_btc_out", default: 0.0
    t.float "sale_btc_in", default: 0.0
    t.float "sale_btc_out", default: 0.0
    t.float "spot_btc_in", default: 0.0
    t.float "spot_btc_out", default: 0.0
    t.bigint "session_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "duplicate", default: false
    t.index ["session_id"], name: "index_reports_on_session_id", unique: true, where: "(duplicate = false)"
  end




  create_table "session_currency_reports", force: :cascade do |t|
    t.date "session_date"
    t.integer "session_id"
    t.bigint "currency_branch_id", default: 0
    t.string "session_state"
    t.integer "currency_id"
    t.string "currency_ticker"
    t.string "currency_repo_id"
    t.string "currency_typeof"
    t.decimal "currency_open_rate", default: "0.0"
    t.decimal "currency_avg_rate", default: "0.0"
    t.decimal "currency_close_rate", default: "0.0"
    t.decimal "currency_open_balance", default: "0.0"
    t.decimal "currency_close_balance", default: "0.0"
    t.bigint "currency_in", default: 0
    t.decimal "currency_in_volume", default: "0.0"
    t.bigint "currency_out", default: 0
    t.decimal "currency_out_volume", default: "0.0"
    t.decimal "currency_off_balance_volume", default: "0.0"
    t.decimal "currency_profits_volume", default: "0.0"
    t.bigint "currency_orders", default: 0
    t.decimal "currency_volume", default: "0.0"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "currency_in_cad_volume", default: "0.0"
    t.decimal "currency_out_cad_volume", default: "0.0"
    t.decimal "currency_off_balance_cad_volume", default: "0.0"
    t.decimal "currency_profits_cad_volume", default: "0.0"
    t.decimal "currency_cad_volume", default: "0.0"
    t.decimal "currency_open_balance_cad"
    t.decimal "currency_close_balance_cad"
    t.decimal "currency_spent"
    t.decimal "currency_spent_cad"
    t.decimal "currency_change"
    t.decimal "currency_change_cad"
    t.json "currency_movements", default: []
    t.json "currency_movements_cad", default: []
    t.json "currency_balance_movements", default: []
    t.json "currency_balance_movements_cad", default: []
    t.string "session_currency"
    t.index ["session_currency"], name: "index_session_currency_reports_on_session_currency", unique: true
  end

  create_table "session_reports", force: :cascade do |t|
    t.bigint "session_id"
    t.date "session_date"
    t.string "session_state"
    t.integer "unique_customers", default: 0
    t.decimal "total_revenue", default: "0.0"
    t.decimal "total_profit", default: "0.0"
    t.decimal "total_off_balance", default: "0.0"
    t.integer "crypto_in", default: 0
    t.integer "crypto_out", default: 0
    t.integer "fiat_in", default: 0
    t.integer "fiat_out", default: 0
    t.integer "metal_in", default: 0
    t.integer "metal_out", default: 0
    t.integer "btc_in", default: 0
    t.integer "btc_out", default: 0
    t.decimal "crypto_profits_volume", default: "0.0"
    t.decimal "crypto_off_balance_volume", default: "0.0"
    t.decimal "fiat_profits_volume", default: "0.0"
    t.decimal "fiat_off_balance_volume", default: "0.0"
    t.decimal "metal_profits_volume", default: "0.0"
    t.decimal "metal_off_balance_volume", default: "0.0"
    t.integer "total_orders", default: 0
    t.decimal "volume", default: "0.0"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "crypto_orders", default: 0
    t.integer "fiat_orders", default: 0
    t.integer "metal_orders", default: 0
    t.integer "btc_orders", default: 0
    t.decimal "btc_off_balance_volume", default: "0.0"
    t.decimal "crypto_volume", default: "0.0"
    t.decimal "crypto_in_volume", default: "0.0"
    t.decimal "crypto_out_volume", default: "0.0"
    t.decimal "fiat_volume", default: "0.0"
    t.decimal "fiat_in_volume", default: "0.0"
    t.decimal "fiat_out_volume", default: "0.0"
    t.decimal "metal_volume", default: "0.0"
    t.decimal "metal_in_volume", default: "0.0"
    t.decimal "metal_out_volume", default: "0.0"
    t.decimal "btc_volume", default: "0.0"
    t.decimal "btc_in_volume", default: "0.0"
    t.decimal "btc_out_volume", default: "0.0"
    t.decimal "btc_profits_volume", default: "0.0"
    t.index ["session_date"], name: "index_session_reports_on_session_date"
    t.index ["session_id"], name: "unique_session_id_index", unique: true
    t.index ["unique_customers"], name: "index_session_reports_on_unique_customers"
  end


  create_table "settings", force: :cascade do |t|
    t.bigint "branch", null: false
    t.json "settings"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "order_quote_service_fee_base_currency", default: 2
    t.string "order_quote_currency_pair_inbound", default: "CAD"
    t.string "order_quote_currency_pair_outbound", default: "BTC"
    t.string "order_quote_btc_network_fee_type", default: "REGULAR"
    t.integer "pagination_page_size", default: 100
    t.integer "data_refresh_interval_minutes", default: 100
    t.integer "thermal_receipt_font_size_pixels", default: 5
    t.integer "thermal_receipt_left_padding_pixels", default: 0
    t.integer "thermal_receipt_right_padding_pixels", default: 0
    t.string "thermal_receipt_order_header_html", default: ""
    t.string "thermal_receipt_order_footer_html", default: ""
    t.string "thermal_receipt_btc_invoice_instructions_html", default: ""
    t.string "brand_name"
    t.text "brand_description"
    t.string "brand_logo_url"
    t.string "brand_address"
    t.string "brand_city"
    t.string "brand_state"
    t.string "brand_postal_code"
    t.string "brand_country"
    t.string "brand_color"
    t.string "brand_website"
    t.string "brand_email"
    t.string "brand_phone"
    t.string "brand_logo_monochrome_url"
    t.integer "order_general_trade_customer_id"
    t.string "order_customer_request_review_message", default: ""
    t.string "fintrac_lvctr_entity_number"
    t.string "fintrac_lvctr_conductor_device_type_code"
    t.string "fintrac_lvctr_transaction_method_type_code"
    t.string "fintrac_lvctr_location_reference_code"
    t.string "fintrac_lvctr_entity_contact_number"
    t.string "fintrac_lvctr_activity_sector_code"
    t.string "fintrac_lvctr_entity_reporting_fintract_number"
    t.integer "business_start_year"
    t.text "thermal_receipt_outbound_crypto_order_disclaimer_html"
    t.text "thermal_receipt_inbound_crypto_order_disclaimer_html"
    t.text "thermal_receipt_scheduled_order_disclaimer_html"
    t.string "external_phone_link"
    t.boolean "order_usb_receipt_auto_print_on_order_complete", default: false
    t.string "thermal_receipt_font_face"
    t.boolean "order_legacy_receipt_auto_print_on_order_complete", default: false
    t.decimal "currency_rate_warn_when_buy_margin_less_than", precision: 18, scale: 8, default: "0.5"
    t.decimal "currency_rate_warn_when_buy_margin_greater_than", precision: 18, scale: 8, default: "5.0"
    t.decimal "currency_rate_warn_when_sell_margin_less_than", precision: 18, scale: 8, default: "0.5"
    t.decimal "currency_rate_warn_when_sell_margin_greater_than", precision: 18, scale: 8, default: "5.0"
    t.decimal "currency_rate_block_when_buy_margin_less_than", precision: 18, scale: 8, default: "0.1"
    t.decimal "currency_rate_block_when_buy_margin_greater_than", precision: 18, scale: 8, default: "10.0"
    t.decimal "currency_rate_block_when_sell_margin_less_than", precision: 18, scale: 8, default: "0.1"
    t.decimal "currency_rate_block_when_sell_margin_greater_than", precision: 18, scale: 8, default: "10.0"
    t.integer "currency_rate_warn_when_crypto_last_updated_minutes_below", default: 15
    t.integer "currency_rate_warn_when_fiat_last_updated_minutes_below", default: 60
    t.integer "currency_rate_warn_when_metal_last_updated_minutes_below", default: 60
    t.integer "currency_rate_block_when_crypto_last_updated_minutes_below", default: 30
    t.integer "currency_rate_block_when_fiat_last_updated_minutes_below", default: 120
    t.integer "currency_rate_block_when_metal_last_updated_minutes_below", default: 120
    t.boolean "currency_rate_use_dynamic_decimal_formatting", default: false
    t.boolean "order_enforce_btc_pay_integrity", default: false
    t.boolean "customer_notes_allow_non_author_teller_edit", default: false
    t.index ["branch"], name: "index_settings_on_branch", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.inet "current_sign_in_ip"
    t.inet "last_sign_in_ip"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "authentication_token", limit: 30
    t.string "first_name"
    t.string "last_name"
    t.integer "active_session_id"
    t.string "rights", default: [], array: true
    t.integer "device_linked_user_id"
    t.string "typeof"
    t.boolean "active"
    t.integer "authorized_branches", default: [], array: true
    t.boolean "admin", default: false
    t.integer "authorized_repo_ids", default: [], array: true
    t.string "authorized_role_names", default: [], array: true
    t.index ["authentication_token"], name: "index_users_on_authentication_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "widgets", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "authorities", "users"
  add_foreign_key "beneficiaries", "customers"
  add_foreign_key "breakdowns", "denominations"
  add_foreign_key "breakdowns", "float_stacks"
  add_foreign_key "cash_flows", "branches"
  add_foreign_key "cash_flows", "currencies"
  add_foreign_key "cash_flows", "repositories"
  add_foreign_key "cash_flows", "sessions"
  add_foreign_key "compliance_rulesets", "users"
  add_foreign_key "currencies", "branches"
  add_foreign_key "currency_swaps", "currencies"
  add_foreign_key "currency_swaps", "repositories"
  add_foreign_key "currency_swaps", "sessions"
  add_foreign_key "currency_swaps", "users"
  add_foreign_key "customers", "customers", column: "merged_id"
  add_foreign_key "data_export_templates", "users"
  add_foreign_key "debit_and_deposits", "currencies"
  add_foreign_key "debit_and_deposits", "sessions"
  add_foreign_key "debit_and_deposits", "users"
  add_foreign_key "denominations", "currencies"
  add_foreign_key "expenses", "currencies"
  add_foreign_key "expenses", "sessions"
  add_foreign_key "flags", "customers"
  add_foreign_key "flags", "users", column: "reviewer_id"
  add_foreign_key "flags", "users", column: "teller_id"
  add_foreign_key "float_stacks", "denominations"
  add_foreign_key "float_stacks", "float_stacks", column: "previous_session_float_stack_id"
  add_foreign_key "float_stacks", "repositories"
  add_foreign_key "float_stacks", "sessions"
  add_foreign_key "float_transfers", "repositories"
  add_foreign_key "float_transfers", "repositories", column: "from_id"
  add_foreign_key "float_transfers", "repositories", column: "to_id"
  add_foreign_key "float_transfers", "sessions"
  add_foreign_key "float_transfers", "users"
  add_foreign_key "global_settings_groups", "branches"
  add_foreign_key "identifications", "customers"
  add_foreign_key "invoices", "orders"
  add_foreign_key "marketings", "customers"
  add_foreign_key "notes", "customers"
  add_foreign_key "notes", "users"
  add_foreign_key "orders", "addresses", column: "customer_address_id"
  add_foreign_key "orders", "contacts", column: "customer_email_contact_id"
  add_foreign_key "orders", "contacts", column: "customer_phone_contact_id"
  add_foreign_key "orders", "customers"
  add_foreign_key "orders", "identifications", column: "customer_identification_id"
  add_foreign_key "orders", "sessions"
  add_foreign_key "receipts", "orders"
  add_foreign_key "receipts", "sessions"
  add_foreign_key "reports", "sessions"
  add_foreign_key "repositories", "branches"
  add_foreign_key "repository_access_logs", "repositories"
  add_foreign_key "repository_access_logs", "sessions"
  add_foreign_key "rules", "users", column: "author_id"
  add_foreign_key "session_access_logs", "branches"
  add_foreign_key "session_access_logs", "sessions"
  add_foreign_key "sessions", "branches"
  add_foreign_key "sessions", "users"
  add_foreign_key "sessions", "users", column: "close_confirm_user_id"
  add_foreign_key "sessions", "users", column: "close_start_user_id"
  add_foreign_key "sessions", "users", column: "open_confirm_user_id"
  add_foreign_key "sessions", "users", column: "open_start_user_id"
end
