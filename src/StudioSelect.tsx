import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import './studio-polish.css';
type Props = {
  value: string | number;
  onChange: (e: { target: { value: string } }) => void;
  children: ReactNode;
  'aria-label'?: string;
  disabled?: boolean;
};
export function StudioSelect(props: Props) {
  const options = Children.toArray(props.children)
    .filter(isValidElement)
    .map((e) => {
      const p = e.props as { value: string | number; children: ReactNode };
      return { value: String(p.value), label: p.children };
    });
  const [open, setOpen] = useState(false),
    [index, setIndex] = useState(0),
    [pos, setPos] = useState({ top: 0, left: 0, width: 180 });
  const ref = useRef<HTMLButtonElement>(null),
    menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const choose = (i: number) => {
    if (options[i]) props.onChange({ target: { value: options[i].value } });
    setOpen(false);
    ref.current?.focus();
  };
  const show = () => {
    const r = ref.current!.getBoundingClientRect();
    setPos({
      left: Math.min(r.left, window.innerWidth - Math.max(180, r.width) - 12),
      top: r.bottom + 6,
      width: Math.max(180, r.width),
    });
    setIndex(
      Math.max(
        0,
        options.findIndex((o) => o.value === String(props.value)),
      ),
    );
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    menu.current?.focus();
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node) && !menu.current?.contains(e.target as Node))
        setOpen(false);
    };
    const reposition = () => setOpen(false);
    document.addEventListener('pointerdown', close);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);
  return (
    <>
      <button
        type="button"
        className="studio-select"
        ref={ref}
        disabled={props.disabled}
        aria-label={props['aria-label']}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            show();
          }
        }}
      >
        {options.find((o) => o.value === String(props.value))?.label}
        <ChevronDown size={14} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            id={id}
            tabIndex={-1}
            role="listbox"
            aria-label={props['aria-label'] ?? 'Choose an option'}
            aria-activedescendant={`${id}-${index}`}
            className="studio-select-menu"
            style={{
              ...pos,
              maxHeight: Math.max(100, Math.min(280, window.innerHeight - pos.top - 12)),
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
                ref.current?.focus();
              }
              if (e.key === 'Tab') setOpen(false);
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                setIndex(
                  (index + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length,
                );
              }
              if (e.key === 'Home') setIndex(0);
              if (e.key === 'End') setIndex(options.length - 1);
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                choose(index);
              }
            }}
          >
            {options.map((o, i) => (
              <div
                id={`${id}-${i}`}
                role="option"
                aria-selected={o.value === String(props.value)}
                key={o.value}
                className={i === index ? 'focused' : ''}
                onPointerMove={() => setIndex(i)}
                onClick={() => choose(i)}
              >
                {o.label}
                {o.value === String(props.value) && <Check size={14} />}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
