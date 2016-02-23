/* Copyright (c) 2010, Sage Software, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @class argos.Calendar
 * @alternateClassName Calendar
 */
import declare from 'dojo/_base/declare';
import array from 'dojo/_base/array';
import lang from 'dojo/_base/lang';
import query from 'dojo/query';
import domClass from 'dojo/dom-class';
import domConstruct from 'dojo/dom-construct';
import _ActionMixin from './_ActionMixin';
import _Widget from 'dijit/_Widget';
import _Templated from './_Templated';
import Dropdown from 'argos/Dropdown';
import getResource from './I18n';

const resource = getResource('calendar');

const __class = declare('argos.Calendar', [ _Widget, _ActionMixin, _Templated], {
  widgetTemplate: new Simplate([
    '<div id="{%= $.id %}" class="calendar panel">',
      '{%! $.calendarHeaderTemplate %}',
      '{%! $.calendarTableTemplate %}',
      '{%! $.calendarFooterTemplate %}',
    '</div>',
  ]),
  calendarHeaderTemplate: new Simplate([
    '<div class="calendar-header">',
      '<span class="calendar__header__icon calendar__header__icon--left fa fa-angle-left" data-action="decrementMonth"></span>',
      '<div class="month" data-dojo-attach-point="monthNode" data-action="toggleMonthModal"></div>',
      '<div class="year" data-dojo-attach-point="yearNode" data-action="toggleYearModal"></div>',
      '<span class="fa fa-angle-right calendar__header__icon calendar__header__icon--right " data-action="incrementMonth"></span>',
    '</div>',
  ]),
  calendarTableTemplate: new Simplate([
     '<table class="calendar-table">',
      '<thead>',
        '{%! $.calendarWeekDaysTemplate %}',
      '</thead>',
      '<tbody data-dojo-attach-point="weeksNode"></tbody>',
     '</table>',
  ]),
  calendarFooterTemplate: new Simplate([
    '<div class="calendar-footer" data-dojo-attach-point="footerNode">',
      '<div class="button button--secondary clear" data-action="clearCalendar" data-dojo-attach-point="clearButton">{%= $.clearText %}</div>',
      '<div class="button button--secondary toToday" data-action="goToToday" data-dojo-attach-point="todayButton">{%= $.todayText %}</div>',
    '</div>',
  ]),
  calendarTableDayTemplate: new Simplate([
    '<td class="day {%= $.month %} {%= $.weekend %} {%= $.selected %} {%= $.isToday %}" data-action="changeDay" data-date="{%= $.date %}">',
      '{%= $.day %}',
    '</td>',
  ]),
  calendarTableDayActiveTemplate: new Simplate([
    '<div class="day__active">',
    '</div>',
  ]),
  calendarTableWeekStartTemplate: new Simplate([
    '<tr class="calendar-week">',
  ]),
  calendarTableWeekEndTemplate: new Simplate([
    '</tr>',
  ]),
  calendarWeekDaysTemplate: new Simplate([
    '<tr class="calendar-weekdays">',
      '<th>{%= $.weekDaysShortText[0] %}</th>',
      '<th>{%= $.weekDaysShortText[1] %}</th>',
      '<th>{%= $.weekDaysShortText[2] %}</th>',
      '<th>{%= $.weekDaysShortText[3] %}</th>',
      '<th>{%= $.weekDaysShortText[4] %}</th>',
      '<th>{%= $.weekDaysShortText[5] %}</th>',
      '<th>{%= $.weekDaysShortText[6] %}</th>',
    '</tr>',
  ]),

  // Localization
  titleText: resource.titleText,
  amText: resource.amText,
  pmText: resource.pmText,
  clearText: resource.clearText,
  todayText: resource.todayText,
  monthsText: [
    {
      value: resource.january,
      key: 'january',
    },
    {
      value: resource.february,
      key: 'february',
    },
    {
      value: resource.march,
      key: 'march',
    },
    {
      value: resource.april,
      key: 'april',
    },
    {
      value: resource.may,
      key: 'may',
    },
    {
      value: resource.june,
      key: 'june',
    },
    {
      value: resource.july,
      key: 'july',
    },
    {
      value: resource.august,
      key: 'august',
    },
    {
      value: resource.september,
      key: 'september',
    },
    {
      value: resource.october,
      key: 'october',
    },
    {
      value: resource.november,
      key: 'november',
    },
    {
      value: resource.december,
      key: 'december',
    },
  ],
  weekDaysShortText: [
    resource.sundayAbbreviated,
    resource.mondayAbbreviated,
    resource.tuesdayAbbreviated,
    resource.wednesdayAbbreviated,
    resource.thursdayAbbreviated,
    resource.fridayAbbreviated,
    resource.saturdayAbbreviated,
  ],

  // Date is an object containing selected day, month, year, time, todayMoment (today), selectedDateMoment, etc.
  date: null,
  id: 'generic_calendar',
  // This boolean value is used to trigger the modal hide and show and must be used by each entity
  isModal: false,
  noClearButton: false,
  showTimePicker: true,
  showSubValues: true,
  _currentMonth: null,
  _currentYear: null,
  _monthDropdown: null,
  _selectWeek: false,
  _selectedDay: null,
  _todayMonth: null,
  _todayYear: null,
  _widgetName: 'calendar',
  _yearDropdown: null,

  changeDay: function changeDay(params) {
    if (!this._selectWeek) {
      this.changeSingleDay(params);
    } else {
      this.changeWeek(params);
    }
    this.onChangeDay(params);
    return this;
  },
  onChangeDay: function onChangeDay() {
  },
  changeMonthShown: function changeMonthShown({ month }) {
    this._monthDropdown.setValue(month.toLowerCase());
    return this;
  },
  changeSingleDay: function changeSingleDay(params) {
    if (params) {
      const selected = query('.selected', this.weeksNode);

      if (selected) {
        array.forEach(selected, (day) => {
          domClass.remove(day, 'selected');
        });
      }

      if (selected) {
        domClass.remove(selected, 'selected');
      }

      if (params.$source) {
        this._selectedDay = params.$source;
        domClass.add(params.$source, 'selected');
      }

      if (params.date) {
        this.date.selectedDateMoment = moment(params.date, 'YYYY-MM-DD');
      }

      if (this.date.monthNumber !== this.date.selectedDateMoment.month()) {
        this.refreshCalendar(this.date);
      }
    }
    return this;
  },
  changeWeek: function changeWeek(params) {
    if (params) {
      const selected = query('.selected', this.weeksNode);

      if (selected) {
        array.forEach(selected, (day) => {
          domClass.remove(day, 'selected');
        });
      }

      if (params.$source.parentNode) {
        this._selectedDay = params.$source;
        array.forEach(params.$source.parentNode.children, (day) => {
          domClass.add(day, 'selected');
        });
      }

      if (params.date) {
        this.date.selectedDateMoment = moment(params.date, 'YYYY-MM-DD');
      }

      if (this.date.monthNumber !== this.date.selectedDateMoment.month()) {
        this.refreshCalendar(this.date);
      }
    }
    return this;
  },
  changeYearShown: function changeYearShown({ year }) {
    this._yearDropdown.setValue(year);
    return this;
  },
  checkAndRenderDay: function checkAndRenderDay(data = {}) {
    const dayIndexer = data.day + data.startingDay - 1;
    if (data.day === data.todayMoment.date() && data.todayMoment.month() === data.dateMoment.month() && data.todayMoment.year() === data.dateMoment.year()) {
      data.isToday = 'isToday';
    } else {
      data.isToday = '';
    }
    if (dayIndexer % 7 === data.weekEnds.Sunday || dayIndexer % 7 === data.weekEnds.Saturday) {
      data.weekend = 'weekend';
    } else {
      data.weekend = '';
    }
    data.date = data.dateMoment.clone().date(data.day).format('YYYY-MM-DD');
    const day = domConstruct.toDom(this.calendarTableDayTemplate.apply(data, this));
    if (data.day === this.date.dayNode && data.month === 'current-month') {
      this._selectedDay = day;
    }
    if (this.showSubValues) {
      this.setSubValue(day, data)
          .setActiveDay(day);
    }
    domConstruct.place(day, data.week);
  },
  clearCalendar: function clearCalendar() {
    const selected = query('.selected', this.weeksNode)[0];

    if (selected) {
      domClass.remove(selected, 'selected');
    }
    this.date.selectedDateMoment = null;
  },
  createMonthDropdown: function createMonthDropdown() {
    if (!this._monthDropdown) {
      this._monthDropdown = new Dropdown({ id: 'month-dropdown ' + this.id, dropdownClass: 'dropdown--medium', onSelect: this.setMonth, onSelectScope: this });
      this._monthDropdown.createList({ items: this.monthsText, defaultValue: this.date.selectedDateMoment.format('MMMM').toLowerCase()});
      this._todayMonth = this._monthDropdown.findValue(this.date.todayMoment.format('MMMM'));
      domConstruct.place(this._monthDropdown.domNode, this.monthNode);
    }
    return this;
  },
  createYearDropdown: function createYearDropdown() {
    if (!this._yearDropdown) {
      this._yearDropdown = new Dropdown({ id: 'year-dropdown ' + this.id, onSelect: this.setYear, onSelectScope: this });
      this._yearDropdown.createList({ items: this.getYearRange(), defaultValue: this.date.selectedDateMoment.format('YYYY')});
      this._todayYear = this._yearDropdown.findValue(this.date.todayMoment.format('YYYY'));
      domConstruct.place(this._yearDropdown.domNode, this.yearNode);
    }
    return this;
  },
  decrementMonth: function decrementMonth() {
    this.date.selectedDateMoment.subtract({ months: 1 });
    this.refreshCalendar(this.date);
  },
  destroy: function destroy() {
    this._yearDropdown.destroy();
    this._monthDropdown.destroy();
    this.inherited(arguments);
  },
  getContent: function getContent() {
    if (this.options.timeless) {
      // Revert back to timeless
      this.date.selectedDateMoment.add({
        minutes: this.date.selectedDateMoment.utcOffset(),
      });
    }
    return this.date;
  },
goToToday: function goToToday() {
  this.date.todayMoment = this.getCurrentDateMoment();
  this.refreshCalendar(this.date);
  const day = query('.isToday', this.weeksNode)[0];
  let params = {};
  if (day) {
    params = { $source: day, date: day.dataset.date };
  }
  this.changeDay(params);
  this.setDropdownsToday();
},
  getDateTime: function getDateTime() {
    const result = this.date.selectedDateMoment;
    return result.toDate();
  },
  getCurrentDateMoment: function getCurrentDateMoment() {
    return moment();
  },
  getSelectedDateMoment: function getSelectedDateMoment() {
    return this.date.selectedDateMoment;
  },
  getYearRange: function getYearRange() {
    const items = [];
    const thisYear = this.date.todayMoment.year();
    for (let i = thisYear - 10; i <= thisYear + 10; i++) {
      items.push(
        {
          value: i,
          key: i,
        }
      );
    }
    return items;
  },
  incrementMonth: function incrementMonth() {
    this.date.selectedDateMoment.add({ months: 1 });
    this.refreshCalendar(this.date);
  },
  init: function init() {
    this.inherited(arguments);
  },
  isActive: function isActive(day) {
    if (day) {
      return query('.day__active', day)[0];
    }
  },
  postRenderCalendar: function postRenderCalendar() {
    if (this._selectWeek) {
      this.changeWeek({ $source: this._selectedDay });
    }
  },
  refresh: function refresh(options) {
    this.date.todayMoment = this.getCurrentDateMoment();
    this._refreshCalendar(this.date);
    this.onRefreshCalendar(options);
  },
  onRefreshCalendar: function onRefreshCalendar() {
  },
  refreshCalendar: function refreshCalendar(date = {}) {
    this._refreshCalendar(date);
    this.onRefreshCalendar(true);
    return this;
  },
  _refreshCalendar: function _refreshCalendar(date = {}) {
    domConstruct.empty(this.weeksNode);
    date.todayMoment = this.getCurrentDateMoment();
    this.renderCalendar(date)
      .changeMonthShown(date)
      .changeYearShown(date);
    return this;
  },
  removeActive: function removeActive(day) {
    if (day) {
      const active = this.isActive(day);
      if (active) {
        domConstruct.destroy(active);
      }
    }
    return this;
  },
  renderCalendar: function renderCalendar({ todayMoment, selectedDateMoment }) {
    const daysInMonth = selectedDateMoment.daysInMonth();
    const startingDay = selectedDateMoment.clone().startOf('month').day();
    const endPrevMonth = selectedDateMoment.clone().startOf('month').subtract({ days: startingDay });
    const startNextMonth = selectedDateMoment.clone().endOf('month').add({ days: 1 });
    const data = {
      todayMoment,
      selectedDateMoment,
      dateMoment: endPrevMonth.clone(),
      week: domConstruct.toDom(this.calendarTableWeekStartTemplate.apply()),
      startingDay: endPrevMonth.clone().startOf('month').day(),
      weekEnds: {
        Sunday: 0,
        Saturday: 6,
      },
    };

    // Iterate through the days that are in the start week of the current month but are in the previous month
    for (let day = endPrevMonth.date(); day < endPrevMonth.date() + startingDay; day++) {
      data.day = day;
      this.checkAndRenderDay(data);
    }

    data.month = 'current-month';
    data.startingDay = startingDay;
    data.dateMoment = selectedDateMoment.clone();
    for (let day = 1; day <= daysInMonth; day++) {
      if (day === selectedDateMoment.date()) {
        data.selected = 'selected';
        this.date.dayNode = day;
      } else {
        data.selected = '';
      }
      data.day = day;
      this.checkAndRenderDay(data);
      if ((day + startingDay) % 7 === 0) {
        domConstruct.place(this.calendarTableWeekEndTemplate.apply(), data.week);
        domConstruct.place(data.week, this.weeksNode);
        data.week = domConstruct.toDom(this.calendarTableWeekStartTemplate.apply());
      }
    }

    data.selected = '';
    data.month = '';
    data.startingDay = startNextMonth.day();
    data.dateMoment = startNextMonth.clone();
    // Iterate through remaining days of the week based on 7 days in the week and ensure there are 6 weeks shown (for consistency)
    for (let day = 1; day <= (1 + data.weekEnds.Saturday - startNextMonth.day()); day++) {
      data.day = day;
      this.checkAndRenderDay(data);
    }
    domConstruct.place(this.calendarTableWeekEndTemplate.apply(), data.week);
    domConstruct.place(data.week, this.weeksNode);

    if (this.weeksNode.children.length === 5) {
      data.week = domConstruct.toDom(this.calendarTableWeekStartTemplate.apply());
      for (let day = 2 + data.weekEnds.Saturday - startNextMonth.day(); day <= (8 + data.weekEnds.Saturday - startNextMonth.day()); day++) {
        data.day = day;
        this.checkAndRenderDay(data);
      }
      domConstruct.place(this.calendarTableWeekEndTemplate.apply(), data.week);
      domConstruct.place(data.week, this.weeksNode);
    }

    this.setDateObject(selectedDateMoment);

    this.postRenderCalendar();

    return this;
  },
  setActiveDay: function setActiveDay(day = {}) {
    if (day.subValue) {
      const active = domConstruct.toDom(this.calendarTableDayActiveTemplate.apply({ count: day.subValue }, this));
      domConstruct.place(active, day, 'last');
    }
    return this;
  },
  setDateObject: function setDateObject(dateMoment = {}) {
    this.date.day = dateMoment.date();
    this.date.month = dateMoment.format('MMMM');
    this.date.monthNumber = dateMoment.month();
    this.date.year = dateMoment.year();
    this.date.date = moment(dateMoment).toDate();

    return this;
  },
  setDropdownsToday: function setDropdownsToday() {
    if (this._monthDropdown.getSelected() !== this._todayMonth) {
      this._monthDropdown.setSelected(this._todayMonth);
    }
    if (this._yearDropdown.getSelected() !== this._todayYear) {
      this._yearDropdown.setSelected(this._todayYear);
    }
    return this;
  },
  setMonth: function setMonth() {
    this.date.selectedDateMoment.month(this._monthDropdown.getValue());
    this.refreshCalendar(this.date);
  },
  setSubValue: function setSubValue() {
    return this;
  },
  setYear: function setYear() {
    this.date.selectedDateMoment.year(this._yearDropdown.getValue());
    this.refreshCalendar(this.date);
  },
  show: function show(options = {}) {
    this.date = {};
    this.options = options || this.options;

    this.titleText = this.options.label ? this.options.label : this.titleText;
    this.showTimePicker = this.options && this.options.showTimePicker;
    if (this.options.timeless) {
      // Undo timeless
      const startDate = moment(this.options && this.options.date);
      startDate.subtract({
        minutes: startDate.utcOffset(),
      });
      this.date.selectedDateMoment = startDate;
    } else {
      this.date.selectedDateMoment = moment((this.options && this.options.date) || moment().clone());
    }
    this.date.todayMoment = this.getCurrentDateMoment();
    if (this.isModal || this.options.isModal || this.noClearButton || this.options.noClearButton) {
      this.clearButton.style.display = 'none';
    }
    this.createMonthDropdown()
        .createYearDropdown();

    this.refreshCalendar(this.date);
  },
  toggleSelectWeek: function toggleSelectWeek() {
    this._selectWeek = !this._selectWeek;
    this.changeDay({ $source: this._selectedDay });
  },
});

lang.setObject('Sage.Platform.Mobile.Calendar', __class);
export default __class;
