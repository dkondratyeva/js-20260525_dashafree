import { createElement } from "../../shared/utils/create-element";

type SortOrder = 'asc' | 'desc';

type SortableTableData = Record<string, string | number>;

interface SortableTableHeader {
  id: string;
  title: string;
  sortable?: boolean;
  sortType?: 'string' | 'number';
  template?: (value: string | number) => string;
}

export default class SortableTable {
  element: HTMLElement | null = null;

  private headerElement: HTMLElement | null = null;
  private bodyElement: HTMLElement | null = null;

  constructor(private headersConfig: SortableTableHeader[] = [], private data: SortableTableData[] = []) {
    this.element = createElement(this.template());
    this.headerElement = this.element.querySelector('[data-element="header"]');
    this.bodyElement = this.element.querySelector('[data-element="body"]');
  }

  private template() {
    const header = this.renderHeader();
    const body = this.renderBody();
    return `
      <div class="sortable-table">
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${header}
        </div>
        <div data-element="body" class="sortable-table__body">
        ${body}
        </div>
      </div>
    `;
  }

  private renderHeader() {
    return this.headersConfig.map(header => {
      return `
        <div class="sortable-table__cell" data-id="${header.id}" data-sortable="${header.sortable ? 'true' : 'false'}">
          <span>${header.title}</span>
          ${header.sortable ? `<span data-element="arrow" class="sortable-table__sort-arrow">
            <span class="sort-arrow"></span>
          </span>` : ''}
        </div>
      `;
    }).join('');
  }

  private renderBody() {
    return this.data.map(row => {
      const cells = this.headersConfig.map(header => {
        const cellData = row[header.id];
        if (header.template) {
          return header.template(cellData);
        }
        return `<div class="sortable-table__cell">${cellData}</div>`;
      }).join('');
      return `<a href="/products/${row.id}" class="sortable-table__row">${cells}</a>`;
    }).join('');
  }

  sort(field: string, order: SortOrder) {
    if (!this.element || !this.headerElement || !this.bodyElement) return;

    const directions = { asc: 1, desc: -1 };

    const column = this.headersConfig.find(header => header.id === field && header.sortable);
    if (!column) return;

    const sortType = column.sortType || 'string';

    this.data = [...this.data].sort((a, b) => {
      const direction = directions[order];
      const aValue = a[field];
      const bValue = b[field];

      if (sortType === 'number') {
        return direction * ((aValue as number) - (bValue as number));
      } else {
        return direction * (aValue as string).localeCompare((bValue as string), ['ru', 'en'], { caseFirst: 'upper' });
      }
    });

    this.bodyElement.innerHTML = this.renderBody();
    this.headerElement.querySelectorAll('.sortable-table__cell').forEach(cell => cell.removeAttribute('data-order'));
    this.headerElement.querySelector(`[data-id="${field}"]`)?.setAttribute('data-order', order);
  }

  remove() {
    if (!this.element) return;
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.element = null;
    this.headerElement = null;
    this.bodyElement = null;
  }
}
