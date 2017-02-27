/**
 * Created by niki_ty on 2017/2/9.
 */
/*
 1.局部变量解析器找起来快一点
 2.有些浏览器不标准的话不见的有windows对象，这时候只需要简单的修改后面的参数就全部能工作
 */
(function (win) {
    var eventHub = new Vue();
    /*返回日期数组*/
    function getCalendar(y, m) {
        y = parseInt(y);
        m = parseInt(m);
        var time = new Date(y, m - 1, 1);
        var lastDate, nextDate, lastMonth = m - 1, nextMonth = m + 1;
        if (m == 1) {
            lastDate = '' + (y - 1) + '-' + 12 + '-';
            nextDate = '' + y + '-' + 2 + '-';
            lastMonth = 12;
        } else if (m == 12) {
            lastDate = '' + y + '-' + 11 + '-';
            nextDate = '' + (y + 1) + '-' + 1 + '-';
            nextMonth = 1;
        } else {
            lastDate = '' + y + '-' + (m - 1) + '-';
            nextDate = '' + y + '-' + (m + 1) + '-';
        }
        var maxNumber = 42;
        var last = [],
            now = [],
            next = [];
        var lastFix = time.getDay() - 1;
        lastFix = lastFix < 0 ? lastFix + 7 : lastFix;
        var lastMaxDate = new Date(y, m - 1, 0).getDate(),
            maxDate = new Date(y, m, 0).getDate();
        var i, t, weekDay;
        for (i = 0; i < lastFix; i++) {
            /*从星期一到昨天*/
            t = lastMaxDate + i - lastFix + 1;
            /*weekDay = (lastFix - 1 + i) % 7;*/
            weekDay = (1 + i) % 7;
            weekDay = weekDay == 0 ? 7 : weekDay;
            last[i] = {month: lastMonth, day: t, weekDay:weekDay, data: lastDate + t}
        }
        for (i = 0; i < maxDate; i++) {
            t = i + 1;
            weekDay = (lastFix + 1 + i) % 7;
            weekDay = weekDay == 0 ? 7 : weekDay;
            now[i] = {month: m, day: t, weekDay:weekDay, data: '' + y + '-' + m + '-' + t}
        }
        var nextFix = maxNumber - maxDate - lastFix;
        for (i = 0; i < nextFix; i++) {
            t = i + 1;
            weekDay = (maxDate % 7 + lastFix + 1 + i) % 7;
            weekDay = weekDay == 0 ? 7 : weekDay;
            next[i] = {month: nextMonth, day: t, weekDay:weekDay, data: nextDate + t}
        }
        var result = last.concat(now, next);
        var cell = [];
        for (i = 0; i < 6; i++) {
            cell.push(result.splice(0, 7));
        }
        return cell;
    }

    var calendarLine = Vue.extend({
        props: ['items', 'cur', 'sel', 'month', 'disabledDay'],
        data: function () {
            return {
            }
        },
        template: '<tr><td v-for="item in items" :class="{\'dt-last\':month!=item.month,\'dt-today\':cur==item.data,\'dt-select\':sel==item.data}">' +
            '<span @click="click(item)" :class="disabledDayStyle(item)">{{item.day}}</span></td></tr>',
        methods: {
            click: function (item) {
                var disDay = this.disabledDay;
                /*.some函数，只要数组中有一个满足则返回true*/
                var disabled = disDay.some(function(el,index,array){return el == item.weekDay});
                if (!disabled){
                    eventHub.$emit('click', item)
                }
            },
            disabledDayStyle: function (item){
                var disDay = this.disabledDay;
                var disabled = disDay.some(function(el,index,array){return el == item.weekDay});
                return {'dt-disabled':disabled};
            }
        }
    });
    /*展示十个年份*/
    var showYear = Vue.extend({
        props: ['nowYear'],
        data: function () {
            var arrYear = [];
            var currentYear = this.nowYear;
            for (var i = 0; i < 5; i++) {
                arrYear[i] = currentYear - 5 + i;
            }
            for (var i = 5; i < 12; i++) {
                arrYear[i] = currentYear - 5 + i;
            }
            return {
                arrYear: arrYear,
                currentYear: currentYear
            }
        },
        template: '<ul class="dt-select"><li v-for="year in arrYear"><span @click="clickYear(year)">{{year}}</span></li>' +
            '<span class="clickYear" @click="toLastYear()">‹</span><span class="clickYear" @click="toNextYear()">›</span></ul>',
        methods: {
            clickYear: function (year) {
                eventHub.$emit('clickYear', year)
            },
            toLastYear: function () {
                for (var i = 0; i < 5; i++) {
                    Vue.set(this.arrYear, i, this.currentYear - 5 + i - 12);
                }
                for (var i = 5; i < 12; i++) {
                    Vue.set(this.arrYear, i, this.currentYear - 5 + i - 12);
                    /*利用索引直接设置一个项时，vue不能检测到数组变化*/
                }
                this.currentYear -= 12;
            },
            toNextYear: function () {
                for (var i = 0; i < 5; i++) {
                    Vue.set(this.arrYear, i, this.currentYear - 5 + i + 12);
                }
                for (var i = 5; i < 12; i++) {
                    Vue.set(this.arrYear, i, this.currentYear - 5 + i + 12);
                }
                this.currentYear += 12;
            }
        }
    });

    var showMonth = Vue.extend({
        props: ['lang'],
        data: function () {
            var arrMonth = [];
            if (this.lang) {
                for (var i = 0; i < 12; i++) {
                    arrMonth[i] = i + 1;
                }
            } else {
                arrMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            }
            return {
                arrMonth: arrMonth
            }
        },
        template: '<ul class="dt-select"><li v-for="month in arrMonth"><span @click="clickMonth(month)">{{month}}</span></li></ul>',
        created: function () {
            eventHub.$on('refresh-month-week', this.refreshMonthWeek);
        },
        beforeDestroy: function () {
            eventHub.$off('refresh-month-week', this.refreshMonthWeek);
        },
        methods: {
            clickMonth: function (month) {
                eventHub.$emit('clickMonth', month)
            },
            refreshMonthWeek: function (lang) {
                if (lang) {
                    for (var i = 0; i < 12; i++) {
                        Vue.set(this.arrMonth, i, i + 1);
                    }
                } else {
                    Vue.set(this.arrMonth, 0, 'Jan');
                    Vue.set(this.arrMonth, 1, 'Feb');
                    Vue.set(this.arrMonth, 2, 'Mar');
                    Vue.set(this.arrMonth, 3, 'Apr');
                    Vue.set(this.arrMonth, 4, 'May');
                    Vue.set(this.arrMonth, 5, 'Jun');
                    Vue.set(this.arrMonth, 6, 'Jul');
                    Vue.set(this.arrMonth, 7, 'Aug');
                    Vue.set(this.arrMonth, 8, 'Sep');
                    Vue.set(this.arrMonth, 9, 'Oct');
                    Vue.set(this.arrMonth, 10, 'Nov');
                    Vue.set(this.arrMonth, 11, 'Dec');
                }
            }
        }
    });

    var dayTitle = Vue.extend({
        props: ['lang'],
        data: function () {
            var week = [];
            if (this.lang) {
                week = ['一', '二', '三', '四', '五', '六', '日']
            } else {
                week = ['MO', 'TU', 'WE', 'TH', 'FR', 'SR', 'SU']
            }
            return {
                week: week
            }
        },
        template: '<tr><th v-for="day in week"><span>{{day}}</span></th></tr>',
        created: function () {
            eventHub.$on('refresh-month-week', this.refreshMonthWeek);
        },
        beforeDestroy: function () {
            eventHub.$off('refresh-month-week', this.refreshMonthWeek);
        },
        methods: {
            refreshMonthWeek: function (lang) {
                if (lang) {
                    Vue.set(this.week, 0, '一');
                    Vue.set(this.week, 1, '二');
                    Vue.set(this.week, 2, '三');
                    Vue.set(this.week, 3, '四');
                    Vue.set(this.week, 4, '五');
                    Vue.set(this.week, 5, '六');
                    Vue.set(this.week, 6, '日');
                } else {
                    Vue.set(this.week, 0, 'MO');
                    Vue.set(this.week, 1, 'TU');
                    Vue.set(this.week, 2, 'WE');
                    Vue.set(this.week, 3, 'TH');
                    Vue.set(this.week, 4, 'FR');
                    Vue.set(this.week, 5, 'SR');
                    Vue.set(this.week, 6, 'SU');
                }
            }
        }
    });

    var calendar = Vue.extend({
        props: ['date', 'config'],
        data: function () {
            var d = date = this.date,
                sel = '';
            if (Object.prototype.toString.call(date) === '[object Date]') {
                sel = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
            } else if (date) {
                var len = ('' + date).length;
                if (len != 10 && len != 13) {
                    d = new Date();
                } else {
                    d = len == 13 ? new Date(parseInt(date)) : new Date(parseInt(date) * 1000)
                }
                sel = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
            } else {
                d = new Date;
            }
            var curTime = new Date;
            var cur = '' + curTime.getFullYear() + '-' + (curTime.getMonth() + 1) + '-' + curTime.getDate();
            var y = d.getFullYear(),
                m = d.getMonth() + 1;
            var data = getCalendar(y, m);
            var note = '',
                lang = true,
                showLang = 'EN',
                showNote = false,
                noteInput = {};
            return {
                sel: sel,
                cur: cur,
                y: y,
                m: m,
                data: data,
                show: false, /*日历面板显隐*/
                showYear: false, /*年份选择显隐*/
                showMonth: false, /*月份选择显隐*/
                note: note, /*输入出错提示*/
                lang: lang, /*中英切换*/
                showLang: showLang, /*中英切换显示*/
                showNote: showNote, /*note面板显隐*/
                noteInput: note /*note数据初始化*/
            }
        },
        template: '<div class="dt-panel">' +
            '<div>' +
            '<input type="text"  class="dt-input" @focus="foc" v-model="sel" :placeholder="config.placeholder">' +
            '<span class="dt-attention">{{note}}</span>' +
            '</div>' +
            '<div v-show = "show">' +
            '<div class="dt-head">' +
            '<div class="dt-lastDate"><a @click="cy(-1)">«</a><a @click="cm(-1)">‹</a></div>' +
            '<span class="dt-nowDate"><span @click="showYear=!showYear,showMonth=false">{{y}} 年</span><span @click="showMonth=!showMonth,showYear=false"> {{m}} 月</span></span>' +
            '<div class="dt-nextDate"><a @click="cm(1)">›</a><a @click="cy(1)">»</a></div>' +
            '<span class="dt-conversion" @click="refreshMonthWeek">{{showLang}}</span>' +
            '</div>' +
            '<div v-show = "showYear" class="dt-yearPanel"><p is="show-year" :nowYear="y"></p></div>' +
            '<div v-show = "showMonth" class="dt-monthPanel"><p is="show-month" :lang="lang"></p></div>' +
            '<table class="dt-table">' +
            '<thead><div is="day-title" :lang="lang"></div></thead>' +
            '<tbody><tr is="calendar-line" v-for="cell in data" :items="cell" :month="m" :sel="sel" :cur="cur" :disabledDay="config.disabledDay"></tr>' +
            '</tbody>' +
            '</table>' +
            '<div class="dt-footer"><a @click="clickNow">{{sel}}</a><span @click="show=false" class="dt-bt">确认</span></div></div>' +
            '<div class = "dt-note" v-show = "showNote">{{sel}}<textarea id = "dt-noteInput"  type="text"></textarea>' +
            '<div class="btn-note"><button @click="clickNoteConsole" class="dt-bt">取消</button><button @click="clickNoteSave" class="dt-bt">保存</button></div></div>' +
            '</div>',
        created: function () {
            eventHub.$on('click', this.click);
            eventHub.$on('clickYear', this.clickYear);
            eventHub.$on('clickMonth', this.clickMonth);
        },
        beforeDestroy: function () {
            eventHub.$off('click', this.click);
            eventHub.$off('clickYear', this.clickYear);
            eventHub.$off('clickMonth', this.clickMonth);
        },
        /*watch选项允许我们执行异步操作，在得到结果之前可以设置中间状态，计算属性无法做到*/
        watch: {
            sel: function (sel) {
                this.note = '';
                this.getNote(sel)
            }
        },
        methods: {
            /*前进后退年*/
            cy: function (offset) {
                this.init(this.y + offset, this.m)
            },
            /*前进后退月*/
            cm: function (offset) {
                this.init(this.y, this.m + offset)
            },
            /*获取当前时间*/
            clickNow: function () {
                var t = new Date();
                var y = t.getFullYear();
                var m = t.getMonth() + 1;
                this.init(y, m);
                this.sel = this.cur;
            },
            /*显示面板*/
            foc: function () {
                this.show = true;
            },
            /*日期切换*/
            init: function (y, m) {
                this.y = parseInt(y);
                this.m = parseInt(m);
                if (this.m <= 0) {
                    this.y -= 1;
                    this.m = 12;
                } else if (this.m >= 13) {
                    this.y += 1;
                    this.m = 1;
                }
                this.data = getCalendar(this.y, this.m);
            },
            /*当前时间，此处data是数组子元素中的参数*/
            click: function (item) {
                this.sel = item.data;
                var arr = item.data.split('-');
                this.y = arr[0];
                this.m = arr[1];
                //     this.date = new Date(this.y,(this.m-1),arr[2]).getTime();
                this.data = getCalendar(this.y, this.m);
                /*点击当天日期控制note面板显隐*/
                this.showNote = true;
                var index = this.sel;
                var el = document.getElementById("dt-noteInput");
                if(this.noteInput[index]){
                    el.value = this.noteInput[index];
                } else {
                        el.value = ''
                }
            },
            /*日期输入提示*/
            getNote: function (sel) {
                var vm = this;
                var regex = /\d{4}-\d{1,2}-\d{1,2}/g;
                if (regex.test(sel)) {
                    var inputDate = sel.split('-');
                    var y = parseInt(inputDate[0], 10);
                    var m = parseInt(inputDate[1], 10);
                    var d = parseInt(inputDate[2], 10);
                    if (new Date(y, m - 1, d).getDate() == d) {
                        this.init(y, m, d);
                    } else {
                        this.note = '当前输入日期不合法！';
                    }
                } else if (sel.length != 0) {
                    this.note = '当前输入日期不合法！';
                }
            },
            /*年份点击事件*/
            clickYear: function (year) {
                this.init(year, this.m);
                this.showYear = false;
            },
            /*月份点击事件*/
            clickMonth: function (month) {
                this.init(this.y, this.CnEnConversion(month));
                this.showMonth = false;
            },
            /*月份中英转换*/
            CnEnConversion: function (m) {
                switch (m) {
                    case  'Jan':
                        m = 1;
                        break;
                    case  'Feb':
                        m = 2;
                        break;
                    case  'Mar':
                        m = 3;
                        break;
                    case  'Apr':
                        m = 4;
                        break;
                    case  'May':
                        m = 5;
                        break;
                    case  'Jun':
                        m = 6;
                        break;
                    case  'Jul':
                        m = 7;
                        break;
                    case  'Aug':
                        m = 8;
                        break;
                    case  'Sep':
                        m = 9;
                        break;
                    case  'Oct':
                        m = 10;
                        break;
                    case  'Nov':
                        m = 11;
                        break;
                    case  'Dec':
                        m = 12;
                        break;
                }
                return m;
            },
            /*中英切换*/
            refreshMonthWeek: function () {
                this.lang = !this.lang;
                /*this.refreshMonthWeek();*/
                eventHub.$emit('refresh-month-week', this.lang);
                if (this.lang) {
                    this.showLang = 'EN'
                } else {
                    this.showLang = 'CN'
                }
            },
            /*note数据保存*/
            clickNoteSave: function () {
                var index = this.sel;
                var el = document.getElementById("dt-noteInput");
                this.showNote = false;
                 if(el.value){
                     /*为什么用Object.assign*/
                     this.noteInput = Object.assign({},this.noteInput,{index:el.value});
                     this.noteInput[index] = el.value;
                 }
            },
            /*note数据取消*/
            clickNoteConsole: function () {
                this.showNote = false;
                var el = document.getElementById("dt-noteInput");
                el.value = ''
            }
        },
        components: {
            'calendar-line': calendarLine,
            'show-year': showYear,
            'show-month': showMonth,
            'day-title': dayTitle
        }
    });
    win.components = win.components || {};
    win.components.calendar = calendar;
})(window);
