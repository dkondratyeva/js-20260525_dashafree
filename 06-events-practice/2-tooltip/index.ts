import { createElement } from "../../shared/utils/create-element";

export default class Tooltip {
  static instance: Tooltip;
  element: HTMLElement | null = null;

  private shiftX = 10;
  private shiftY = 10;

  constructor() {
    if (Tooltip.instance) {
      return Tooltip.instance;
    }
    Tooltip.instance = this;
  }

  private template(html: string) {
    return `
      <div class="tooltip">
        ${html}
      </div>
    `;
  }

  render(html: string) {
    if (this.element) {
      this.element.remove();
    }

    this.element = createElement(this.template(html));
    document.body.append(this.element);
  }

  initialize() {
    document.addEventListener('pointerover', this.onPointerOver);
    document.addEventListener('pointerout', this.onPointerOut);
  }

  private moveAt(x: number, y: number) {
    if (this.element) {
      this.element.style.left = `${x + this.shiftX}px`;
      this.element.style.top = `${y + this.shiftY}px`;
    }
  }

  private onPointerOver = (event: PointerEvent) => {
    const target = event.target as HTMLElement;
    const tooltipElement = target.closest('[data-tooltip]') as HTMLElement;

    if (!tooltipElement) return;

    const tooltip = tooltipElement.dataset.tooltip;
    if (tooltip !== undefined) {
      this.render(tooltip);
      this.moveAt(event.clientX, event.clientY);
      document.addEventListener('pointermove', this.onPointerMove);
    }
  }

  private onPointerOut = (event: PointerEvent) => {
    if (!this.element) return;

    document.removeEventListener('pointermove', this.onPointerMove);
    this.element.remove();
    this.element = null;
  }

  private onPointerMove = (event: PointerEvent) => {
    this.moveAt(event.clientX, event.clientY);
  }

  remove() {
    if (!this.element) return;
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.element = null;
    document.removeEventListener('pointerover', this.onPointerOver);
    document.removeEventListener('pointerout', this.onPointerOut);
    document.removeEventListener('pointermove', this.onPointerMove);
  }
}
