import { useEffect, useRef, useState, type PointerEvent as PE } from 'react';
import type { ScrapObject } from '../lib/types';

type Pos = { x: number; y: number; rotate: number };

function storageKey(slug: string, id: string) {
	return `junk-journal:${slug}:${id}`;
}

export default function ScrapItem({
	obj,
	slug,
	tidyToken,
}: {
	obj: ScrapObject;
	slug: string;
	tidyToken: number;
}) {
	const canDrag = obj.interact.includes('drag');
	const [pos, setPos] = useState<Pos>({ x: obj.x, y: obj.y, rotate: obj.rotate });
	const [flipped, setFlipped] = useState(false);
	const [flapOpen, setFlapOpen] = useState(false);
	const [pressed, setPressed] = useState(false);
	const [clipNudge, setClipNudge] = useState(0);
	const [fan, setFan] = useState(0);
	const [dragging, setDragging] = useState(false);
	const posRef = useRef(pos);
	posRef.current = pos;
	const drag = useRef<{
		startX: number;
		startY: number;
		origX: number;
		origY: number;
		moved: boolean;
		kind: 'move' | 'fan';
		startFan: number;
	} | null>(null);
	const pageRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (tidyToken > 0) {
			localStorage.removeItem(storageKey(slug, obj.id));
			setPos({ x: obj.x, y: obj.y, rotate: obj.rotate });
			return;
		}
		try {
			const raw = localStorage.getItem(storageKey(slug, obj.id));
			if (raw) setPos(JSON.parse(raw) as Pos);
		} catch {
			/* ignore */
		}
	}, [slug, obj.id, obj.x, obj.y, obj.rotate, tidyToken]);

	function persist(next: Pos) {
		setPos(next);
		try {
			localStorage.setItem(storageKey(slug, obj.id), JSON.stringify(next));
		} catch {
			/* ignore */
		}
	}

	function onPointerDown(e: PE<HTMLDivElement>, kind: 'move' | 'fan' = 'move') {
		if (kind === 'move' && !canDrag) return;
		e.stopPropagation();
		e.preventDefault();
		pageRef.current = (e.currentTarget as HTMLElement).closest('.page');
		drag.current = {
			startX: e.clientX,
			startY: e.clientY,
			origX: pos.x,
			origY: pos.y,
			moved: false,
			kind,
			startFan: fan,
		};
		setDragging(true);

		const move = (ev: PointerEvent) => {
			if (!drag.current) return;
			const dx = ev.clientX - drag.current.startX;
			const dy = ev.clientY - drag.current.startY;
			if (Math.hypot(dx, dy) > 4) drag.current.moved = true;
			if (drag.current.kind === 'fan') {
				setFan(Math.min(1, Math.max(0, drag.current.startFan + dy / 140)));
				return;
			}
			const box = pageRef.current?.getBoundingClientRect();
			if (!box) return;
			const nx = Math.min(88, Math.max(0, drag.current.origX + (dx / box.width) * 100));
			const ny = Math.min(88, Math.max(0, drag.current.origY + (dy / box.height) * 100));
			setPos((p) => ({ ...p, x: nx, y: ny }));
		};
		const up = () => {
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', up);
			if (!drag.current) {
				setDragging(false);
				return;
			}
			const wasMove = drag.current.moved;
			const dragKind = drag.current.kind;
			drag.current = null;
			setDragging(false);
			if (dragKind === 'move' && wasMove) {
				persist(posRef.current);
				return;
			}
			if (wasMove) return;
			if (obj.interact.includes('flip')) setFlipped((v) => !v);
			if (obj.interact.includes('flap')) setFlapOpen((v) => !v);
			if (obj.interact.includes('stamp')) {
				setPressed(true);
				window.setTimeout(() => setPressed(false), 220);
			}
			if (obj.interact.includes('clip')) setClipNudge((n) => (n === 0 ? 18 : 0));
		};
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', up);
	}

	const style = {
		left: `${pos.x}%`,
		top: `${pos.y}%`,
		width: `${obj.width}%`,
		zIndex: dragging ? 80 : obj.z,
		transform: `rotate(${pos.rotate + (pressed ? 2 : 0) + clipNudge * 0.2}deg) scale(${pressed ? 0.9 : 1})`,
		['--clip' as string]: `${clipNudge}px`,
	};

	const classes = [
		'scrap',
		`scrap-${obj.type}`,
		`frame-${obj.frame}`,
		canDrag ? 'can-drag' : '',
		dragging ? 'is-dragging' : '',
		flipped ? 'is-flipped' : '',
		flapOpen ? 'is-open' : '',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<div
			className={classes}
			style={style}
			onPointerDown={(e) => onPointerDown(e, 'move')}
		>
			{obj.type === 'waterfall' && (
				<div className="waterfall">
					{(obj.srcs ?? []).map((src, i) => (
						<img
							key={src}
							src={src}
							alt=""
							className="waterfall-card"
							style={{
								transform: `translateY(${-fan * (i + 1) * 28}px) rotate(${(i - 1) * 4 * fan}deg)`,
								zIndex: (obj.srcs?.length ?? 0) - i,
							}}
						/>
					))}
					<button
						type="button"
						className="pull-tab"
						aria-label="Pull photo stack"
						onPointerDown={(e) => onPointerDown(e, 'fan')}
					>
						PULL
					</button>
				</div>
			)}

			{obj.type === 'photo' && (
				<div className="polaroid-inner">
					<div className="polaroid-face front">
						{obj.src ? <img src={obj.src} alt="" /> : null}
					</div>
					<div className="polaroid-face back">
						<p>{obj.back ?? obj.text ?? ''}</p>
					</div>
				</div>
			)}

			{obj.type === 'note' && <p className="hand">{obj.text}</p>}

			{obj.type === 'tape' && <span className={`washi washi-${obj.color ?? 'plain'}`} />}

			{obj.type === 'sticker' && (
				<span className="sticker-blob" style={{ background: obj.color ?? '#ffd60a' }}>
					{obj.text}
				</span>
			)}

			{obj.type === 'clip' && <span className="paperclip" aria-hidden="true" />}

			{obj.type === 'title' || obj.type === 'letters' ? (
				<div className="ransom" aria-hidden={false}>
					{(obj.text ?? '').split('').map((ch, i) =>
						ch === ' ' ? (
							<span key={i} className="ransom-space">
								{' '}
							</span>
						) : (
							<span key={i} className={`ransom-tile t${i % 5}`}>
								{ch}
							</span>
						),
					)}
				</div>
			) : null}

			{obj.type === 'speech' && <p className="speech-bubble">{obj.text}</p>}

			{obj.type === 'star' && (
				<svg viewBox="0 0 100 100" className="star-svg">
					<polygon
						points="50,4 61,38 98,38 68,58 79,92 50,72 21,92 32,58 2,38 39,38"
						fill={obj.color ?? '#6d2c3a'}
					/>
				</svg>
			)}

			{obj.type === 'envelope' && (
				<div className="envelope">
					<div className="envelope-flap" />
					<div className="envelope-body">
						{obj.src ? <img src={obj.src} alt="" /> : null}
						<p className="hand">{obj.text}</p>
					</div>
				</div>
			)}
		</div>
	);
}
