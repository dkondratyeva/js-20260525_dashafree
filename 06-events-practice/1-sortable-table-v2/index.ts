import { createElement } from "../../shared/utils/create-element";

type SortOrder = 'asc' | 'desc';

type SortableTableData = Record<string, string | number>;

type SortableTableSort = {
  id: string;
  order: SortOrder;
};

interface SortableTableHeader {
  id: string;
  title: string;
  sortable?: boolean;
  sortType?: 'string' | 'number' | 'custom';
  template?: (value: string | number) => string;
  customSorting?: (a: SortableTableData, b: SortableTableData) => number;
}

interface Options {
  data?: SortableTableData[];
  sorted?: SortableTableSort;
  isSortLocally?: boolean;
}

export default class SortableTable {
  element: HTMLElement | null = null;

  private headerElement: HTMLElement | null = null;
  private bodyElement: HTMLElement | null = null;
  private arrowElement: HTMLElement;

  private data: SortableTableData[] = [];
  private isSortLocally: boolean;

  private static readonly ARROW_TEMPLATE = `
    <span data-element="arrow" class="sortable-table__sort-arrow">
      <span class="sort-arrow"></span>
    </span>
  `;

  constructor(private headersConfig: SortableTableHeader[] = [], {
    data = [],
    sorted,
    isSortLocally = true
  }: Options = {}) {
    this.data = [...data];
    this.isSortLocally = isSortLocally;

    this.element = createElement(this.template());
    this.arrowElement = createElement(SortableTable.ARROW_TEMPLATE);
    this.headerElement = this.element.querySelector('[data-element="header"]');
    this.bodyElement = this.element.querySelector('[data-element="body"]');

    this.headerElement?.addEventListener('pointerdown', this.onHeaderClick);

    if (sorted) {
      this.sort(sorted.id, sorted.order);
    }
  }

  private onHeaderClick = (event: Event) => {
    const target = event.target as HTMLElement;
    const headerCell = target.closest('.sortable-table__cell') as HTMLElement;

    if (!headerCell || headerCell.dataset.sortable !== 'true') {
      return;
    }

    const field = headerCell.dataset.id!;
    const currentOrder = headerCell.dataset.order as SortOrder | undefined;
    const newOrder: SortOrder = currentOrder === 'desc' ? 'asc' : 'desc';

    this.sort(field, newOrder);
  };

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
        </div>
      `;
    }).join('');
  }

  private renderBody(data: SortableTableData[] = this.data) {
    return data.map(row => {
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
    if (this.isSortLocally) {
      this.sortOnClient(field, order);
    } else {
      this.sortOnServer(field, order);
    }
  }

  private sortOnClient(field: string, order: SortOrder) {
    if (!this.headerElement || !this.bodyElement) return;

    const directions = { asc: 1, desc: -1 };

    const column = this.headersConfig.find(h => h.id === field && h.sortable);
    if (!column) return;

    const sortType = column.sortType || 'string';

    const sorted = [...this.data].sort((a, b) => {
      const direction = directions[order];
      const aValue = a[field];
      const bValue = b[field];

      if (sortType === 'number') {
        return direction * ((aValue as number) - (bValue as number));
      } else if (sortType === 'custom' && column.customSorting) {
        return direction * column.customSorting(a, b);
      } else {
        return direction * (aValue as string).localeCompare((bValue as string), ['ru', 'en'], { caseFirst: 'upper' });
      }
    });

    this.bodyElement.innerHTML = this.renderBody(sorted);
    this.updateHeaderSort(field, order);
  }

  private sortOnServer(_field: string, _order: SortOrder) {
    // TODO: Implement server-side sorting logic
  }

  private updateHeaderSort(field: string, order: SortOrder) {
    if (!this.headerElement) return;

    this.headerElement.querySelectorAll('.sortable-table__cell').forEach(cell => {
      cell.removeAttribute('data-order');
    });

    const activeCell = this.headerElement.querySelector(`[data-id="${field}"]`);
    if (activeCell) {
      activeCell.setAttribute('data-order', order);
      activeCell.appendChild(this.arrowElement);
    }
  }

  remove() {
    if (!this.element) return;
    this.element.remove();
  }

  destroy() {
    this.headerElement?.removeEventListener('pointerdown', this.onHeaderClick);
    this.remove();
    this.element = null;
    this.headerElement = null;
    this.bodyElement = null;
  }
}
