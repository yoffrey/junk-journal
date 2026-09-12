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

function leafLabel(leaf: BookLeaf | undefined) {
	if (!leaf) return 'page';
	if (leaf.kind === 'cover') return 'cover';
	if (leaf.kind === 'contents') return 'contents';
	if (leaf.kind === 'about') return 'about';
	return leaf.piece.title;
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
	const menuRef = useRef<HTMLDivElement | null>(null);
	const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
	const flipRef = useRef(flip);
	const narrowRef = useRef(narrow);
	const paneRef = useRef(pane);
	const indexRef = useRef(index);
	const menuOpenRef = useRef(menuOpen);
	flipRef.current = flip;
	narrowRef.current = narrow;
	paneRef.current = pane;
	indexRef.current = index;
	menuOpenRef.current = menuOpen;

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

	function go(dir: -1 | 1) {
		if (flipRef.current) return;
		if (narrowRef.current) {
			if (dir === 1 && paneRef.current === 'left' && indexRef.current > 0) {
				setPane('right');
				return;
			}
			if (dir === -1 && paneRef.current === 'right') {
				setPane('left');
				return;
			}
		}
		const next = indexRef.current + dir;
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

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				setMenuOpen(false);
				return;
			}
			if (menuOpenRef.current) return;
			if (e.key === 'ArrowRight') go(1);
			if (e.key === 'ArrowLeft') go(-1);
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [leaves]);

	useEffect(() => {
		if (!menuOpen) return;
		const root = menuRef.current;
		const previouslyFocused = document.activeElement as HTMLElement | null;
		const focusables = () =>
			root
				? Array.from(
						root.querySelectorAll<HTMLElement>(
							'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
						),
					)
				: [];

		const first = focusables()[0];
		first?.focus();

		function onKey(e: KeyboardEvent) {
			if (e.key !== 'Tab' || !root) return;
			const items = focusables();
			if (items.length === 0) return;
			const firstItem = items[0];
			const lastItem = items[items.length - 1];
			if (e.shiftKey && document.activeElement === firstItem) {
				e.preventDefault();
				lastItem.focus();
			} else if (!e.shiftKey && document.activeElement === lastItem) {
				e.preventDefault();
				firstItem.focus();
			}
		}

		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('keydown', onKey);
			(previouslyFocused ?? menuTriggerRef.current)?.focus?.();
		};
	}, [menuOpen]);

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

	const hint = narrow
		? pane === 'left'
			? 'swipe or tap the edge for the other half'
			: 'swipe back, or keep going to turn the page'
		: leaf?.kind === 'cover'
			? 'tap the cover to open'
			: 'flip the edge · peel the tape menu · drag the scraps';

	const canPrev = index > 0 || (narrow && pane === 'right');
	const canNext = index < leaves.length - 1 || (narrow && pane === 'left' && index > 0);

	return (
		<div className="desk">
			<div
				className={`book ${leaf?.kind === 'cover' ? 'is-cover' : ''} ${flip ? `flip-${flip}` : ''} ${peek && !menuOpen ? 'page-peek' : ''}`}
				aria-busy={flip ? true : undefined}
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
					ref={menuTriggerRef}
					type="button"
					className={`hamburger ${peek ? 'is-peeking' : ''} ${menuOpen ? 'is-open' : ''}`}
					aria-label={menuOpen ? 'Close contents' : 'Open contents'}
					aria-expanded={menuOpen}
					aria-controls="journal-contents"
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
						<button
							type="button"
							className={`turn-zone left${!canPrev ? ' is-disabled' : ''}`}
							aria-label={narrow && pane === 'right' ? 'Show left page' : 'Previous page'}
							disabled={!canPrev}
							onClick={() => go(-1)}
						/>
						<button
							type="button"
							className={`turn-zone right${!canNext ? ' is-disabled' : ''}`}
							aria-label={narrow && pane === 'left' ? 'Show right page' : 'Next page'}
							disabled={!canNext}
							onClick={() => go(1)}
						/>
						<div className="rings" aria-hidden="true">
							<i />
							<i />
							<i />
						</div>
					</>
				)}

				{narrow && leaf?.kind !== 'cover' && (
					<div className="pane-cue" role="group" aria-label="Page half">
						<button
							type="button"
							className={pane === 'left' ? 'is-active' : ''}
							aria-pressed={pane === 'left'}
							onClick={() => setPane('left')}
						>
							left
						</button>
						<button
							type="button"
							className={pane === 'right' ? 'is-active' : ''}
							aria-pressed={pane === 'right'}
							onClick={() => setPane('right')}
						>
							right
						</button>
					</div>
				)}
			</div>

			{menuOpen && (
				<div
					ref={menuRef}
					id="journal-contents"
					className="contents-overlay"
					role="dialog"
					aria-modal="true"
					aria-label="Journal contents"
				>
					<button type="button" className="close-overlay" onClick={() => setMenuOpen(false)}>
						close
					</button>
					<p className="hand overlay-kicker">where to</p>
					<ol>
						{leaves.map((item, i) => (
							<li key={i}>
								<button
									type="button"
									className={i === index ? 'is-current' : ''}
									aria-current={i === index ? 'page' : undefined}
									onClick={() => jump(i)}
								>
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

			<p className="hint" aria-live="polite">
				{hint}
			</p>
			<span className="visually-hidden" aria-live="polite">
				{leafLabel(leaf)}
				{narrow && leaf?.kind !== 'cover' ? `, ${pane} half` : ''}
			</span>
		</div>
	);
}

function Cover({ onOpen }: { onOpen: () => void }) {
	return (
		<button type="button" className="cover" onClick={onOpen} aria-label="Open junk journal">
			<div className="cover-denim" />
			<div className="cover-paper">
				<div className="ransom cover-title" aria-hidden="true">
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
					A personal junk journal for paper, clay, stickers, and whatever else stuck this season.
					Flip around. Drag things. Leave fingerprints.
				</p>
			</Page>
			<Page side="right" hidden={narrow && pane !== 'right'}>
				<p className="speech-bubble about-bubble">messy on purpose</p>
				<p className="hand about-aside">tidy only if you must.</p>
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
	const chips = [...piece.materials, ...piece.tags].slice(0, 5);

	return (
		<div className={`spread palette-${piece.palette}`} key={`${piece.slug}-${tidyToken}`}>
			{(['left', 'right'] as const).map((side) => (
				<Page
					key={side}
					side={side}
					hidden={narrow && pane !== side}
					date={formatPageDate(piece.date)}
				>
					{piece.objects
						.filter((o) => o.page === side)
						.map((obj, i) => (
							<ScrapItem
								key={obj.id}
								obj={obj}
								slug={piece.slug}
								tidyToken={tidyToken}
								enterDelay={i * 45}
							/>
						))}
					{side === 'left' && chips.length > 0 && (
						<ul className="material-chips" aria-label="Materials and tags">
							{chips.map((chip) => (
								<li key={chip}>{chip}</li>
							))}
						</ul>
					)}
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
