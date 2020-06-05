export class Checkboxland {
  constructor(props = {}) {
    if (typeof props.fillValue !== 'undefined') _checkForValidValue(props.fillValue);

    this.displayEl = document.querySelector(props.selector || '#checkboxland');
    this.dimensions = _textDimensionsToArray(props.dimensions || '8x8');

    // The data object. Don't access this directly. Use methods like getData() and setData() instead.
    // Maybe we can restrict access to this variable in the future, using Proxies. See examples here:
    // https://github.com/bryanbraun/music-box-fun/commit/f399255261e9b8ab9fb8c10edbbedd55a639e9d1
    this._data = this.getEmptyMatrix(props.fillValue || 0);

    _createInitialCheckboxDisplay(this.displayEl, this._data);
  }

  getCheckboxValue(x, y) {
    const isWithinDisplay = (typeof this._data[y] !== 'undefined' && typeof this._data[y][x] !== 'undefined');

    if (!isWithinDisplay) {
      throw new Error(`The location (x: ${x}, y: ${y}) is outside of this checkbox display`);
    }

    return this._data[y][x];
  }

  setCheckboxValue(x, y, newValue) {
    const isWithinDisplay = (typeof this._data[y] !== 'undefined' && typeof this._data[y][x] !== 'undefined');

    _checkForValidValue(newValue);

    if (!isWithinDisplay) return;

    this._data[y][x] = newValue;

    // We can assume the checkboxEl exists because it's within the display.
    const checkboxEl = this.displayEl.children[y].children[x];

    // Handle indeterminate newValues
    if (newValue === 2) {
      if (checkboxEl.indeterminate) return;

      checkboxEl.indeterminate = true;
      // The indeterminate state masks the checked state, so we always
      // uncheck indeterminate checkboxes to prevent weird state combinations.
      checkboxEl.checked = false;
      return;
    }
    // Handle non-indeterminate newValues
    else {
      // Remove any previously set indeterminate values.
      if (checkboxEl.indeterminate) {
        checkboxEl.indeterminate = false;
      }

      // If the checkbox value matches, then we don't need to update it.
      if (checkboxEl.checked === Boolean(newValue)) return;

      checkboxEl.checked = Boolean(newValue);
    }
  }

  getData() {
    const clonedData = this._data.map((row) => row.slice());
    return clonedData;
  }

  setData(data) {
    data.forEach((rowData, rowIndex) => {
      rowData.forEach((cellValue, cellIndex) => {
        this.setCheckboxValue(cellIndex, rowIndex, cellValue);
      });
    });
  }

  clearData() {
    const emptyMatrix = this.getEmptyMatrix();
    this.setData(emptyMatrix);
  }

  // This kind of method makes more sense as a plugin but I needed to
  // use it in the core library anyways so I decided to expose it here.
  getEmptyMatrix(fillValue = 0, width = this.dimensions[0], height = this.dimensions[1]) {
    const matrix = [];

    for (let i = 0; i < height; i++) {
      matrix[i] = [];
      for (let j = 0; j < width; j++) {
        matrix[i][j] = fillValue;
      }
    }

    return matrix;
  }

  static extend(pluginObj = {}) {
    if (!pluginObj.name || !pluginObj.exec) {
      throw new Error('Your plugin must have a "name" and an "exec" function.');
    }

    if (pluginObj.cleanUp) {
      pluginObj.exec.cleanUp = pluginObj.cleanUp;
    }

    this.prototype[pluginObj.name] = pluginObj.exec;
  }
}


// Private helper functions

function _checkForValidValue(value) {
  if (value === 0 || value === 1 || value === 2) {
    return;
  }

  throw new Error(`${value} is not a valid checkbox value`);
}

function _textDimensionsToArray(textDimensions) {
  const errorMessage = 'The dimensions you provided are invalid.';

  if (typeof textDimensions !== 'string') throw new Error(errorMessage);

  const dimArray = textDimensions.split('x').map(val => Number(val));
  const isValid = (dimArray.length === 2 && !isNaN(dimArray[0]) && !isNaN(dimArray[0]));

  if (!isValid) throw new Error(errorMessage);

  return textDimensions.split('x').map(val => Number(val));
}

function _createInitialCheckboxDisplay(displayEl, data) {
  displayEl.innerHTML = '';
  displayEl.style.overflowX = 'auto';
  displayEl.setAttribute('aria-hidden', true);

  data.forEach(rowData => {
    const rowEl = document.createElement('div');
    rowEl.style.lineHeight = 0.75;
    rowEl.style.whiteSpace = 'nowrap';

    rowData.forEach(cellData => {
      const checkboxEl = document.createElement('input');
      const indeterminateVal = cellData === 2 ? true : false;
      const checkedVal = indeterminateVal ? false : Boolean(cellData);

      checkboxEl.style.margin = 0;
      checkboxEl.style.verticalAlign = 'top';
      checkboxEl.type = 'checkbox';
      checkboxEl.tabIndex = '-1';
      checkboxEl.checked = checkedVal;
      checkboxEl.indeterminate = indeterminateVal;

      rowEl.appendChild(checkboxEl);
    });

    displayEl.appendChild(rowEl);
  });
}
