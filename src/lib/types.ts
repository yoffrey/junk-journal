export type Interact = 'drag' | 'flip' | 'flap' | 'waterfall' | 'stamp' | 'clip';

export type ScrapObject = {
	id: string;
	type: string;
	src?: string;
	srcs?: string[];
	text?: string;
	back?: string;
	x: number;
	y: number;
	rotate: number;
	width: number;
	z: number;
	page: 'left' | 'right';
	frame: string;
	color?: string;
	interact: Interact[];
};

export type Piece = {
	slug: string;
	title: string;
	date: string;
	medium: string;
	materials: string[];
	tags: string[];
	palette: 'tropical' | 'primary' | 'burgundy' | 'soda' | 'midnight' | 'kraft';
	body: string;
	objects: ScrapObject[];
};

export type BookLeaf =
	| { kind: 'cover' }
	| { kind: 'contents'; pieces: { slug: string; title: string; medium: string }[] }
	| { kind: 'piece'; piece: Piece }
	| { kind: 'about' };
