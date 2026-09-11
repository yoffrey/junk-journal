# Junk journal

A personal site that behaves like a scrapbook: you flip pages, peel a corner with the tape menu, and drag photos, stickers, and notes around the spread.

## Run it

Needs Node 22+.

```bash
npm install
npm run dev
```

Open the local URL, then:

- Click the cover to open the book
- Click or drag the page edges (or swipe) to turn
- Hover the taped hamburger (top right) — the page corner lifts; click it for contents
- Drag scraps; flip polaroids; open the envelope; pull the PALMA photo tab
- **Tidy the page** restores the layout from the markdown

## Add your work

Each piece is a folder:

```
src/content/pieces/my-project/
  index.md
```

Put photos in `public/pieces/` (or another public folder) and point `src` at them, for example `/pieces/my-photo.jpg`.

Copy an existing `index.md`. Frontmatter fields:

- `title`, `date`, `medium`, `materials`, `tags`
- `palette`: `tropical` | `primary` | `burgundy` | `soda` | `midnight` | `kraft`
- `objects`: items glued to the left or right page

Object fields:

| field | what it does |
| --- | --- |
| `id` | stable id (used for saved drag positions) |
| `type` | `photo`, `note`, `tape`, `sticker`, `clip`, `letters`, `speech`, `star`, `envelope`, `waterfall` |
| `x` `y` | position in % of the page |
| `rotate` `width` `z` | tilt, size %, stacking order |
| `page` | `left` or `right` |
| `src` / `srcs` | image path(s). `waterfall` uses `srcs` |
| `text` / `back` | caption, or polaroid reverse |
| `frame` | `none`, `polaroid`, `torn`, `sticker` |
| `interact` | `drag`, `flip`, `flap`, `waterfall`, `stamp`, `clip` — use `[]` to glue something down |

The markdown body under the frontmatter is the little caption on the left page.

Then run `npm run dev` again. Dragged layouts live in the browser (`localStorage`); tidy clears them for that spread.

Placeholder SVGs in `public/pieces/` are stand-ins until you drop in real photos.
