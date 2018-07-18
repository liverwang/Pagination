var Pagination = (function() {
  var obj = function(el, options) {
    this.container = $(el)

    this.pageIndex = 0
    this.pageSize = 1
    this.pageCount = 0
    this.dataCount = 0
    this.unit = '条'
    this.pageSizeOptions = [10, 20, 30, 40]
    this.handleToPage = this._handleToPage

    if (options) {
      this.pageSize = options.pageSize
      this.dataCount = options.dataCount || 0
      this.toPage = options.toPage
      this.unit = options.unit || this.unit
      this.pageSizeOptions = options.pageSizeOptions || this.pageSizeOptions
      this.scrollTop = options.scrollTop
    }

    this._generateStyle()

    if (options.autoLoad && typeof this.toPage == 'function') {
      this.toPage.call(this, 0)
    } else {
      this._generate()
    }
  }

  obj.prototype = {
    handleEvent: function(e, element) {
      element = !element ? e.srcElement : element
      element = element || e.target
      if (element.classList.contains('disable')) return
      switch (element.tagName) {
        case 'LI':
          if (element.classList.contains('page-more')){
            this._handlePageJump(element)
            return
          }
          this._handleToPage(element.attributes['p_index'].value)
          break
        case 'SELECT':
          this._handleToPage(0, element.value)
          break
        case 'INPUT':
          if (e.keyCode !== 13) return
          try {
            this._handleToPage(parseInt(element.value) - 1)
          } catch (e) {}
          element.value = ''
          break
        default:
          this._handleToPage(element.attributes['p_index'].value)
          break
      }
    },

    _handlePageJump: function(element) {
      const p_index = element.attributes['p_index'].value
      const pageFirstMore = this.container.find('.page-more.first')
      const pageLastMore =  this.container.find('.page-more.last')

      // 向前5页
      if(element.classList.contains('first')){
        pageFirstMore.attr('p_index', Math.max(1, parseInt(pageFirstMore.attr('p_index')) - 5))
        pageLastMore.attr('p_index', Math.min(this.pageCount, parseInt(pageLastMore.attr('p_index')) - 5))
      }

      // 向后5页
      if(element.classList.contains('last')) {
        pageFirstMore.attr('p_index', Math.max(1, parseInt(pageFirstMore.attr('p_index')) + 5))
        pageLastMore.attr('p_index', Math.min(this.pageCount, parseInt(pageLastMore.attr('p_index')) + 5))
      }

      this._getShowIndex()
    },

    _handleToPage: function(_pageIndex, _pageSize) {
      _pageIndex = Math.min(_pageIndex, this.pageCount - 1)
      _pageIndex = Math.max(_pageIndex, 0)

      if (_pageIndex === this.pageIndex && _pageSize === this.pageSize) {
        return
      }

      this._chooseItem(_pageIndex)

      if (typeof this.toPage == 'function') {
        this.toPage.call(this, parseFloat(_pageIndex), _pageSize)
      }
    },

    updateCount: function(count, pageSize) {
      this.dataCount = count
      this.pageSize = pageSize || this.pageSize
      this._generate()
    },

    _generate: function() {
      if (this.dataCount === 0 ) {
        this.container.empty()
        return
      }

      this.pageCount = Math.ceil(this.dataCount / this.pageSize)

      var page = document.createElement('ul')
      page.className = 'page'

      // 总数
      var pageTotal = document.createElement('li')
      pageTotal.className = 'page-total'
      pageTotal.innerHTML = `总共${this.dataCount}${this.unit}`
      page.appendChild(pageTotal)

      // 首页
      var pageFirst = document.createElement('li')
      pageFirst.className = 'page-item page-first'
      pageFirst.setAttribute('p_index', 0)
      pageFirst.title = '首页'
      page.appendChild(pageFirst)

      // 首页更多
      var pageFirstMore = document.createElement('li')
      pageFirstMore.className = 'page-item page-more first'
      pageFirstMore.innerHTML = '…'
      pageFirstMore.title = '向前5页'
      // 末页更多
      var pageLastMore = document.createElement('li')
      pageLastMore.className = 'page-item page-more last'
      pageLastMore.innerHTML = '…'
      pageLastMore.title = '向后5页'

      // 页码
      for (var i = 0; i < this.pageCount; i++) {
        if (this.pageCount > 7 && i === this.pageCount - 1) {
          pageLastMore.setAttribute('p_index', i)
          page.appendChild(pageLastMore)
        }
        var pageItem = document.createElement('li')
        pageItem.className = 'page-item page-index'
        pageItem.innerHTML = i + 1
        pageItem.setAttribute('p_index', i)
        page.appendChild(pageItem)
        if (this.pageCount > 7 && i === 0) {
          pageFirstMore.setAttribute('p_index', i)
          page.appendChild(pageFirstMore)
        }
      }

      // 末页
      var pageLast = document.createElement('li')
      pageLast.className = 'page-item page-last'
      pageLast.setAttribute('p_index', this.pageCount - 1)
      pageLast.title = '末页'
      page.appendChild(pageLast)

      var pageOptions = document.createElement('li')
      pageOptions.className = 'page-options'

      // 页码
      var pageSizeChange = document.createElement('div')
      pageSizeChange.className = 'page-options-size-changer'

      // 页码尺寸选择

      var pageSizeSelect = document.createElement('select')

      for (var i = 0; i < this.pageSizeOptions.length; i++) {
        var pageSizeOption = document.createElement('option')
        pageSizeOption.innerHTML = `${this.pageSizeOptions[i]}条 / 页`
        pageSizeOption.value = this.pageSizeOptions[i]
        if (this.pageSizeOptions[i] === parseInt(this.pageSize)) {
          pageSizeOption.setAttribute('selected', '')
        }

        pageSizeOption.setAttribute('p_size', i)
        pageSizeSelect.appendChild(pageSizeOption)
      }
      pageSizeSelect.value = this.pageSize
      pageSizeChange.appendChild(pageSizeSelect)
      pageOptions.appendChild(pageSizeChange)

      // 页面快捷跳转
      var pageSizeJumper = document.createElement('div')
      pageSizeJumper.className = 'page-options-jumper'
      pageSizeJumper.innerHTML = '跳至<input type="text" />页'
      pageOptions.appendChild(pageSizeJumper)
      page.appendChild(pageOptions)

      // 清空分页内容
      this.container.empty()
      this.container.append(page)

      // 绑定分页元素事件
      this._bindEvent()
      this._chooseItem(0)
    },

    _bind: function(element, event) {
      switch (event) {
        case 'click':
          if (this._isIE()) {
            var that = this
            element.onclick = function() {
              that.handleEvent.call(that, null, element)
            }
          } else {
            element.addEventListener('click', this, false)
          }
          break
        case 'change':
          if (this._isIE()) {
            var that = this
            element.onchange = function() {
              that.handleEvent.call(that, null, element)
            }
          } else {
            element.addEventListener('change', this, false)
          }
          break
        case 'keyup':
          if (this._isIE()) {
            var that = this
            element.onkeyup = function() {
              that.handleEvent.call(that, null, element)
            }
          } else {
            element.addEventListener('keyup', this, false)
          }
          break
        default:
          if (this._isIE()) {
            var that = this
            element.onclick = function() {
              that.handleEvent.call(that, null, element)
            }
          } else {
            element.addEventListener('click', this, false)
          }
          break
      }
    },

    _bindEvent: function() {
      var startEl = $(this.container).find('.page-first')
      for (var i = 0; i < startEl.length; i++) {
        this._bind(startEl[i])
      }

      var endEl = $(this.container).find('.page-last')
      for (var i = 0; i < endEl.length; i++) {
        this._bind(endEl[i])
      }

      var indexEl = $(this.container).find('.page-index')
      for (var i = 0; i < indexEl.length; i++) {
        this._bind(indexEl[i])
      }

      var sizeChangeEl = $(this.container).find(
        '.page-options-size-changer select'
      )
      for (var i = 0; i < sizeChangeEl.length; i++) {
        this._bind(sizeChangeEl[i], 'change')
      }

      var pageJumperEl = $(this.container).find('.page-options-jumper input')
      for (var i = 0; i < pageJumperEl.length; i++) {
        this._bind(pageJumperEl[i], 'keyup')
      }

      var pageFirstMoreEl = $(this.container).find('.page-more.first')
      for (var i = 0; i < pageFirstMoreEl.length; i++) {
        this._bind(pageFirstMoreEl[i], 'click')
      }

      var pageLastMoreEl = $(this.container).find('.page-more.last')
      for (var i = 0; i < pageLastMoreEl.length; i++) {
        this._bind(pageLastMoreEl[i], 'click')
      }
    },

    _generateStyle: function() {
      var str_css = `
        .page{list-style:none;font-family:'PingFangSC-Regular'}
        .page li{float:left;height:32px;line-height:32px;margin:0 5px 5px 0;color:#495060;cursor:default}
        .page li.page-more{line-height:24px}
        .page .page-item.hide{display:none}
        .page-first,.page-item,.page-last,.page-more{height:32px;width:32px;text-align:center;border-radius:4px;border:1px solid #d9d9d9;position:relative}
        .page-first,.page-last{background-image:url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABcUlEQVRYR+3Wv0vDQBQH8PcCEiWCm5t/RXEwIu2gpAElWbJqQBAUXPw/HN1KMf4DVm3aiEX8N1R0cRLcuiUpTxKwiqJ9uVy8pVnz4/vJ3bt3h6D4QsX5MAWwRsBy/DUNqUUALxrSQe/87EHW1LEATcePEMHKQwlek1QzB2H7WQaCB3B3Wgi4Ow6UiGABGp43Pxsb14hgykawAFnoiufNLcTGQDaCDagKUQhQBaIwYIxIjB4CNMrWhBAgC7XtQ530YVQWIQyQhSgF+AsBSKv9TvA0qVmVBnwgQB9eAcDGZyB1+51g618AtdrezOJSHH4FEFEYXQSblQOyYvzx90Rv6QjNm+7pY6WA31YCkVaPLtv3k8Kz+8I1oHQZ5vuCqkYke1MqNAWywwvVQFVnAtYI5OGJcYsAy2U3n+8rgwVouv4xAhzJDmdPge36dwBQV3YotZztdQ3xJDuWj1Lc53Q4ThNijwD3YyLPsWpA5MPcd6aAd3uY6yHvR4KoAAAAAElFTkSuQmCC');background-size:20px 20px;background-position:center center;background-repeat:no-repeat no-repeat}
        .page-first{transform:rotate(180deg)}
        .page-item.active,.page-item:hover,.page-more.active,.page-more:hover{color:#fff;background-color:#ae6b38;opacity:.6008}
        .page-first:hover,.page-last:hover{opacity:.6008;background-color:#fff}
        .page-first.disable,.page-last.disable{color:#bbbec4;background-image:url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABVUlEQVRYR+3WP0rEQBQG8G8YRARPkSFzA5uIrIVio6ew0tJ7WNrtLXRFQcRr6CNpUhkski5N8mQgC8ui7ksyY5pNmz/fLzPvzYzCxJeaOB9bgGgEsiw7appmzsy51vraGPPha+pEACJ6AnDWhX4yc2KtzXwgpIA5gMuVQG8IEaAoiv2qqp4BJL4RIoALzfN8r67rF98IMSAUohcgBKI3YAXxCOB4bE0MArhQItoF4NpzFGIwwBdiFOAvBIDDOI7TTYvVaMASwcz3SqnTZSAzP1hrL/4FwMw7RLRYAyystefBAa4Yf/j7L611YoyhoIDfOkFrPYui6H1TuLs/uAYmbcNuX5hmIfK9KfWaAt/hvWog1JlANAIuvCzLV6XUwdjNZ70zRAAiugVw4ztcPAVE9AZgNtmhNE3Tk7Zt77pj+ZVkhZMsQuIRkH5syHOiGhjyYek7W8A3kqX9IZmYSrEAAAAASUVORK5CYII=')}
        .page-first.disable.active,.page-first.disable:hover,.page-last.disable.active,.page-last.disable:hover{opacity:1;background-color:#fff}.page-options{margin-left:20px}
        .page-options-size-changer{display:inline-block}
        .page-options-size-changer select{outline-style:none;-webkit-appearance:none;width:auto;text-align:center;background-color:transparent;padding:0 15px;height:32px;margin:0;border:1px solid #d9d9d9}
        .page-options-size-changer select option{text-align:center;height:32px;font-family:PingFangSC-Regular;color:#495060}
        .page-options-jumper{display:inline-block;margin-left:10px}.page-options-jumper input{display:inline-block;height:32px;width:50px;border-radius:4px;border:1px solid #d9d9d9;text-align:center;margin:0 10px;padding:5px 10px}.page-options-jumper input:focus{outline-style:none}@media screen and (max-width:750px){.page-options{display:none}}
      `

      if (this._isIE()) {
        if (document.styleSheets['pagination_style']) {
          return
        }

        var ss = document.createStyleSheet()
        ss.owningElement.id = 'pagination_style'
        ss.cssText = str_css
      } else {
        if (document.getElementById('pagination_style')) {
          return
        }
        var style = document.createElement('style')
        style.id = 'pagination_style'
        style.type = 'text/css'
        style.innerHTML = str_css
        document
          .getElementsByTagName('HEAD')
          .item(0)
          .appendChild(style)
      }
    },

    _chooseItem: function(index) {
      if (this.curSelectedItem) {
        this.curSelectedItem.removeClass('active')
      }

      this.pageIndex = index
      this.curSelectedItem = $(this.container).find(
        '.page-index[p_index=' + index + ']'
      )
      this.curSelectedItem.addClass('active')
      if (index === 0) {
        this.container.find('.page-first').addClass('disable')
      } else {
        this.container.find('.page-first').removeClass('disable')
      }

      if (index === this.pageCount - 1) {
        this.container.find('.page-last').addClass('disable')
      } else {
        this.container.find('.page-last').removeClass('disable')
      }

      this._getShowIndex(index)

      this._bindEvent()
    },

    _getShowIndex: function(index) {
      var $container = $(this.container)
      const pageFirstMore = $container.find('.page-more.first')
      const pageLastMore = $container.find('.page-more.last')
      const pageFirstMoreIndex = parseInt(pageFirstMore[0] && pageFirstMore[0].getAttribute('p_index') || 1)
      const pageLastMoreIndex = parseInt(pageLastMore[0] && pageLastMore[0].getAttribute('p_index') || this.pageCount)

      const centerPageIndex = Math.floor((pageLastMoreIndex + pageFirstMoreIndex) / 2)
      $container.find('.page-index').map((index, item) => {
        const p_index = parseInt(item.getAttribute('p_index'))
        if(p_index === 0) return
        if(p_index === this.pageCount - 1 ) return

        item.classList.add('hide')
        // 显示more区间中间的5个页码
        if(p_index + 1 > centerPageIndex - 3 && p_index + 1 < centerPageIndex + 3){
          item.classList.remove('hide')
        }
      })

      // 控制pageFirstMore是否显示
      if(centerPageIndex < 5) {
        pageFirstMore.addClass('hide')
      } else {
        pageFirstMore.removeClass('hide')
      }

      // 控制pageLastMore是否显示
      if(centerPageIndex > this.pageCount - 5) {
        pageLastMore.addClass('hide')
      } else {
        pageLastMore.removeClass('hide')
      }

    },

    _isIE: function() {
      var navigatorName = 'Microsoft Internet Explorer'
      return navigator.appName == navigatorName
    }
  }

  return obj
})()