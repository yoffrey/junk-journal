import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { BookLeaf, Piece } from '../lib/types';
import ScrapItem from './ScrapItem';

function hashFor(i: number, leaves: BookLeaf[]) {
	const leaf = leaves[i];
	if (!leaf) return '#cover';
	if (leaf.kind === 'cover') return '#cover';
	if (leaf.kind === 'contents') return '#contents';
	if (leaf.kind === 'about') return '#about';
	return `#${leaf.piece.slug}`;
}

function indexFromHash(hash: string, leaves: BookLeaf[]) {
	const id = hash.replace(/^#/, '');
	if (!id || id === 'cover') return 0;
	const idx = leaves.findIndex((leaf) => {
		if (id === 'contents') return leaf.kind === 'contents';
		if (id === 'about') return leaf.kind === 'about';
		return leaf.kind === 'piece' && leaf.piece.slug === id;
	});
	return idx === -1 ? 0 : idx;
}

function prefersReducedMotion() {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatPageDate(iso: string) {
	const [year, month, day] = iso.slice(0, 10).split('-');
	if (!year || !month || !day) return iso;
	return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

export default function Book({ leaves }: { leaves: BookLeaf[] }) {
	const [index, setIndex] = useState(0);
	const [pane, setPane] = useState<'left' | 'right'>('left');
	const [peek, setPeek] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [flip, setFlip] = useState<null | 'next' | 'prev'>(null);
	const [tidy, setTidy] = useState<Record<string, number>>({});
	const [narrow, setNarrow] = useState(false);
	const touch = useRef<{ x: number; y: number } | null>(null);

	useEffect(() => {
		const mq = window.matchMedia('(max-width: 820px)');
		const apply = () => setNarrow(mq.matches);
		apply();
		mq.addEventListener('change', apply);
		return () => mq.removeEventListener('change', apply);
	}, []);

	useEffect(() => {
		setIndex(indexFromHash(window.location.hash, leaves));
		const onHash = () => setIndex(indexFromHash(window.location.hash, leaves));
		window.addEventListener('hashchange', onHash);
		return () => window.removeEventListener('hashchange', onHash);
	}, [leaves]);

	useEffect(() => {
		const next = hashFor(index, leaves);
		if (window.location.hash !== next) history.replaceState(null, '', next);
	}, [index, leaves]);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'ArrowRight') go(1);
			if (e.key === 'ArrowLeft') go(-1);
			if (e.key === 'Escape') setMenuOpen(false);
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	function go(dir: -1 | 1) {
		if (flip) return;
		if (narrow) {
			if (dir === 1 && pane === 'left' && index > 0) {
				setPane('right');
				return;
			}
			if (dir === -1 && pane === 'right') {
				setPane('left');
				return;
			}
		}
		const next = index + dir;
		if (next < 0 || next >= leaves.length) return;
		if (prefersReducedMotion()) {
			setIndex(next);
			setPane(dir === 1 ? 'left' : 'right');
			return;
		}
		setFlip(dir === 1 ? 'next' : 'prev');
		window.setTimeout(() => {
			setIndex(next);
			setPane(dir === 1 ? 'left' : 'right');
			setFlip(null);
		}, 620);
	}

	function jump(i: number) {
		setIndex(i);
		setPane('left');
		setMenuOpen(false);
		setFlip(null);
	}

	const leaf = leaves[index];
	const pieces = useMemo(
		() =>
			leaves
				.filter((l): l is { kind: 'piece'; piece: Piece } => l.kind === 'piece')
				.map((l) => l.piece),
		[leaves],
	);

	return (
			<div className="desk">
			<div
				className={`book ${leaf?.kind === 'cover' ? 'is-cover' : ''} ${flip ? `flip-${flip}` : ''} ${peek && !menuOpen ? 'page-peek' : ''}`}
				onTouchStart={(e) => {
					const t = e.changedTouches[0];
					if (t) touch.current = { x: t.clientX, y: t.clientY };
				}}
				onTouchEnd={(e) => {
					if (!touch.current) return;
					const t = e.changedTouches[0];
					if (!t) return;
					const dx = t.clientX - touch.current.x;
					touch.current = null;
					if (dx < -50) go(1);
					if (dx > 50) go(-1);
				}}
			>
			<button
				type="button"
				className={`hamburger ${peek ? 'is-peeking' : ''} ${menuOpen ? 'is-open' : ''}`}
				aria-label="Open contents"
				aria-expanded={menuOpen}
				onMouseEnter={() => setPeek(true)}
				onMouseLeave={() => setPeek(false)}
				onFocus={() => setPeek(true)}
				onBlur={() => setPeek(false)}
				onClick={(e) => {
					e.stopPropagation();
					setMenuOpen((v) => !v);
				}}
			>
				<span />
				<span />
				<span />
			</button>

				{leaf?.kind === 'cover' ? (
					<Cover onOpen={() => go(1)} />
				) : leaf?.kind === 'contents' ? (
					<ContentsSpread
						pieces={pieces}
						onJump={(slug) => {
							const i = leaves.findIndex((l) => l.kind === 'piece' && l.piece.slug === slug);
							if (i >= 0) jump(i);
						}}
						narrow={narrow}
						pane={pane}
					/>
				) : leaf?.kind === 'about' ? (
					<AboutSpread narrow={narrow} pane={pane} />
				) : leaf?.kind === 'piece' ? (
					<PieceSpread
						piece={leaf.piece}
						tidyToken={tidy[leaf.piece.slug] ?? 0}
						onTidy={() =>
							setTidy((t) => ({ ...t, [leaf.piece.slug]: (t[leaf.piece.slug] ?? 0) + 1 }))
						}
						narrow={narrow}
						pane={pane}
					/>
				) : null}

				<div className="page-curl" aria-hidden="true">
					<span className="curl-cast" />
					<span className="curl-back" />
					<span className="curl-crease" />
					<span className="curl-face" />
				</div>

				{leaf?.kind !== 'cover' && (
					<>
						<button type="button" className="turn-zone left" aria-label="Previous page" onClick={() => go(-1)} />
						<button type="button" className="turn-zone right" aria-label="Next page" onClick={() => go(1)} />
						<div className="rings" aria-hidden="true">
							<i />
							<i />
							<i />
						</div>
					</>
				)}
			</div>

			{menuOpen && (
				<div className="contents-overlay" role="dialog" aria-label="Journal contents">
					<button type="button" className="close-overlay" onClick={() => setMenuOpen(false)}>
						close
					</button>
					<ol>
						{leaves.map((item, i) => (
							<li key={i}>
								<button type="button" onClick={() => jump(i)}>
									{item.kind === 'cover' && 'Cover'}
									{item.kind === 'contents' && 'Contents'}
									{item.kind === 'about' && 'About'}
									{item.kind === 'piece' && item.piece.title}
								</button>
							</li>
						))}
					</ol>
				</div>
			)}

			<p className="hint">flip the edge, hover the tape menu, drag the scraps</p>
		</div>
	);
}

function Cover({ onOpen }: { onOpen: () => void }) {
	return (
		<button type="button" className="cover" onClick={onOpen}>
			<div className="cover-denim" />
			<div className="cover-paper">
				<div className="ransom cover-title">
					{'JUNK'.split('').map((ch, i) => (
						<span key={i} className={`ransom-tile t${i % 5}`}>
							{ch}
						</span>
					))}
				</div>
				<p className="hand cover-sub">a scrapbook of things I made</p>
				<img className="cover-photo" src="/pieces/flowers-1.svg" alt="" />
				<span className="washi washi-check cover-tape" />
			</div>
		</button>
	);
}

function ContentsSpread({
	pieces,
	onJump,
	narrow,
	pane,
}: {
	pieces: Piece[];
	onJump: (slug: string) => void;
	narrow: boolean;
	pane: 'left' | 'right';
}) {
	return (
		<div className="spread palette-primary">
			<Page side="left" hidden={narrow && pane !== 'left'}>
				<h2 className="hand page-heading">this book</h2>
				<ol className="toc">
					{pieces.map((p) => (
						<li key={p.slug}>
							<button type="button" onClick={() => onJump(p.slug)}>
								<span className="toc-num">{formatPageDate(p.date)}</span>
								<span className="toc-title">{p.title}</span>
								<em>{p.medium}</em>
							</button>
						</li>
					))}
				</ol>
			</Page>
			<Page side="right" hidden={narrow && pane !== 'right'}>
				<p className="hand toc-note">
					stickers move. polaroids flip. envelopes open. pull the tab on palma.
				</p>
				<span className="sticker-blob toc-sticker">index</span>
			</Page>
		</div>
	);
}

function AboutSpread({ narrow, pane }: { narrow: boolean; pane: 'left' | 'right' }) {
	return (
		<div className="spread palette-burgundy">
			<Page side="left" hidden={narrow && pane !== 'left'}>
				<h2 className="hand page-heading">who made this mess</h2>
				<p className="hand about-copy">
					This is a personal junk journal for art and crafts — paper, clay, stickers, whatever
					sticks. Replace the placeholder photos with yours. Drag things around. Leave it messy.
				</p>
			</Page>
			<Page side="right" hidden={narrow && pane !== 'right'}>
				<p className="speech-bubble about-bubble">drop a folder in src/content/pieces and rebuild</p>
			</Page>
		</div>
	);
}

function PieceSpread({
	piece,
	tidyToken,
	onTidy,
	narrow,
	pane,
}: {
	piece: Piece;
	tidyToken: number;
	onTidy: () => void;
	narrow: boolean;
	pane: 'left' | 'right';
}) {
	return (
		<div className={`spread palette-${piece.palette}`}>
			{(['left', 'right'] as const).map((side) => (
				<Page
					key={side}
					side={side}
					hidden={narrow && pane !== side}
					date={formatPageDate(piece.date)}
				>
					{piece.objects
						.filter((o) => o.page === side)
						.map((obj) => (
							<ScrapItem key={obj.id} obj={obj} slug={piece.slug} tidyToken={tidyToken} />
						))}
					{side === 'right' && (
						<button type="button" className="tidy" onClick={onTidy}>
							tidy the page
						</button>
					)}
					{side === 'left' && <p className="spread-caption hand">{piece.body}</p>}
				</Page>
			))}
		</div>
	);
}

function Page({
	side,
	hidden,
	date,
	children,
}: {
	side: 'left' | 'right';
	hidden?: boolean;
	date?: string;
	children: ReactNode;
}) {
	return (
		<div className={`page ${side}${hidden ? ' is-hidden' : ''}`}>
			{children}
			{date ? <p className="page-date">{date}</p> : null}
		</div>
	);
}
