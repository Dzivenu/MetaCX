export interface NavigationItem {
  name: string;
  description: string;
  icon: string;
  link: string;
  side: 'admin' | 'portal';
}

export interface NavigationConfig {
  admin: NavigationItem[];
  portal: NavigationItem[];
}