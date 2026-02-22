export interface FrlinkContent {
  name: string;
  avatar: string;
  description: string;
  url: string;
}

export interface Sponsor {
	name: string;
	avatar: string | null;
	date: string;
	amount: string;
}

export interface Friend {
	name: string;
	avatar: string;
	description: string;
	url: string;
}