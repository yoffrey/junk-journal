import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const interact = z.enum(['drag', 'flip', 'flap', 'waterfall', 'stamp', 'clip']);

const scrapObject = z.object({
	id: z.string().optional(),
	type: z
		.enum([
			'photo',
			'note',
			'tape',
			'sticker',
			'clip',
			'title',
			'speech',
			'star',
			'envelope',
			'waterfall',
			'letters',
		])
		.default('photo'),
	src: z.string().optional(),
	srcs: z.array(z.string()).optional(),
	text: z.string().optional(),
	back: z.string().optional(),
	x: z.number(),
	y: z.number(),
	rotate: z.number().default(0),
	width: z.number().default(24),
	z: z.number().default(1),
	page: z.enum(['left', 'right']).default('left'),
	frame: z.enum(['none', 'polaroid', 'torn', 'sticker']).default('none'),
	color: z.string().optional(),
	interact: z.array(interact).default([]),
});

const pieces = defineCollection({
	loader: glob({
		pattern: '**/index.md',
		base: './src/content/pieces',
		generateId: ({ entry }) => entry.split('/')[0] ?? entry,
	}),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		medium: z.string(),
		materials: z.array(z.string()).default([]),
		tags: z.array(z.string()).default([]),
		palette: z.enum(['tropical', 'primary', 'burgundy']).default('tropical'),
		objects: z.array(scrapObject),
	}),
});

export const collections = { pieces };
