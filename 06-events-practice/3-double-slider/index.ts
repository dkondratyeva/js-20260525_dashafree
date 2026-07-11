import { createElement } from "../../shared/utils/create-element";

type DoubleSliderSelected = {
  from: number;
  to: number;
};

interface Options {
  min?: number;
  max?: number;
  formatValue?: (value: number) => string;
  selected?: DoubleSliderSelected;
}

export default class DoubleSlider {
  element: HTMLElement | null = null;
  min: number;
  max: number;
  formatValue: (value: number) => string;
  selected: DoubleSliderSelected;

  subElements: Record<string, HTMLElement> = {};

  private dragging: HTMLElement | null = null;

  constructor({
    min = 0,
    max = 100,
    formatValue = value => String(value),
    selected
  }: Options = {}) {
    this.min = min;
    this.max = max;
    this.formatValue = formatValue;
    this.selected = selected ?? { from: min, to: max };

    this.render();
  }

  private render() {
    this.element = createElement(this.template());
    this.subElements = this.getSubElements(this.element);

    this.initEventListeners();
  }

  private getSubElements(element: HTMLElement): Record<string, HTMLElement> {
    const result: Record<string, HTMLElement> = {};
    const elements = element.querySelectorAll('[data-element]');

    for (const el of elements) {
      const name = el.getAttribute('data-element');
      if (name) {
        result[name] = el as HTMLElement;
      }
    }

    return result;
  }

  private template() {
    const { from, to } = this.selected;
    const range = this.max - this.min;

    const left = range > 0 ? Math.floor(((from - this.min) / range) * 100) : 0;
    const right = range > 0 ? Math.floor(((this.max - to) / range) * 100) : 100;

    return `
      <div class="range-slider">
        <span data-element="from">${this.formatValue(from)}</span>
        <div class="range-slider__inner" data-element="inner">
          <span class="range-slider__progress" data-element="progress" style="left: ${left}%; right: ${right}%"></span>
          <span class="range-slider__thumb-left" data-element="thumbLeft" style="left: ${left}%"></span>
          <span class="range-slider__thumb-right" data-element="thumbRight" style="right: ${right}%"></span>
        </div>
        <span data-element="to">${this.formatValue(to)}</span>
      </div>
    `;
  }

  private initEventListeners() {
    this.subElements.thumbLeft.addEventListener('pointerdown', this.onDown);
    this.subElements.thumbRight.addEventListener('pointerdown', this.onDown);
  }

  private onDown = (event: PointerEvent) => {
    event.preventDefault();

    this.dragging = event.target as HTMLElement;

    if (this.element) {
      this.element.classList.add("range-slider_dragging");
    }

    document.addEventListener("pointermove", this.onMove);
    document.addEventListener("pointerup", this.onUp, { once: true });
  };

  private onMove = ({ clientX }: PointerEvent) => {
    const { left, right, width } = this.subElements.inner.getBoundingClientRect();

    if (this.dragging === this.subElements.thumbLeft) {
      let newLeft = (clientX - left) / width;
      this.updateThumb('left', newLeft);
    }

    if (this.dragging === this.subElements.thumbRight) {
      let newRight = (right - clientX) / width;
      this.updateThumb('right', newRight);
    }
  };

  private onUp = () => {
    if (this.element) {
      this.element.classList.remove("range-slider_dragging");
    }

    this.dragging = null;

    document.removeEventListener("pointermove", this.onMove);

    this.dispatchEvent();
  };

  private updateThumb(side: 'left' | 'right', valuePct: number) {
    if (valuePct < 0) valuePct = 0;

    if (side === 'left') {
      const rightPct = parseFloat(this.subElements.thumbRight.style.right) / 100;
      if (valuePct + rightPct > 1) valuePct = 1 - rightPct;
    } else {
      const leftPct = parseFloat(this.subElements.thumbLeft.style.left) / 100;
      if (leftPct + valuePct > 1) valuePct = 1 - leftPct;
    }

    const percent = valuePct * 100;

    if (side === 'left') {
      this.subElements.thumbLeft.style.left = `${percent}%`;
      this.subElements.progress.style.left = `${percent}%`;
      this.selected.from = Math.round(this.min + valuePct * (this.max - this.min));
      this.subElements.from.innerHTML = this.formatValue(this.selected.from);
    } else {
      this.subElements.thumbRight.style.right = `${percent}%`;
      this.subElements.progress.style.right = `${percent}%`;
      this.selected.to = Math.round(this.max - valuePct * (this.max - this.min));
      this.subElements.to.innerHTML = this.formatValue(this.selected.to);
    }
  }

  private dispatchEvent() {
    const event = new CustomEvent("range-select", {
      detail: {
        from: this.selected.from,
        to: this.selected.to
      },
      bubbles: true
    });

    if (this.element) {
      this.element.dispatchEvent(event);
    }
  }

  remove() {
    if (!this.element) return;
    this.element.remove();
  }

  destroy() {
    document.removeEventListener("pointermove", this.onMove);
    document.removeEventListener("pointerup", this.onUp);

    this.remove();

    this.element = null;
    this.dragging = null;
  }
}

