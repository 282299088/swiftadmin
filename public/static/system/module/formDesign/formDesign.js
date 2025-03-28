// +----------------------------------------------------------------------
// | layui表单设计器 [基于Sortable开发]
// +----------------------------------------------------------------------
// | Copyright (c) 2020-2030 http://www.swiftadmin.net
// +----------------------------------------------------------------------
// | git://github.com/meystack/layui-form-design.git 616550110
// +----------------------------------------------------------------------
// | Author: meystack <coolsec@foxmail.com> Apache 2.0 License Code
// +----------------------------------------------------------------------
layui.define(['form', 'jquery', 'layer', 'admin', 'cascader'], function (exports) {
  "use strict";

  var $ = layui.$
    , form = layui.form
    , layer = layui.layer
    , admin = layui.admin
    , cascader = layui.cascader

    //模块名
    , MOD_NAME = 'formDesign'
    , MOD_INDEX = 'layui_' + MOD_NAME + '_index' //模块索引名
    , TAG_NAME = undefined
    //外部接口
    , MODULE_FORMDESIGN_NAME = {
      config: {}
      , index: layui[MOD_NAME] ? (layui[MOD_NAME].index + 10000) : 0

      //设置全局项
      , set: function (options) {
        var that = this;
        that.config = $.extend({}, that.config, options);
        return that;
      }

      //事件
      , on: function (events, callback) {
        return layui.onevent.call(this, MOD_NAME, events, callback);
      }
    }

    //操作当前实例
    , thisTags = function () {
      var that = this
        , options = that.config
        , id = options.id || that.index;

      thisTags.that[id] = that; //记录当前实例对象

      return {
        config: options
        //重置实例
        , reload: function (options) {
          that.reload.call(that, options);
        }
      }
    }

    //字符常量
    , STR_ELEM = 'layui-MODULE_FORMDESIGN_NAME', STR_HIDE = 'layui-hide', STR_DISABLED = 'layui-disabled'
    , STR_NONE = 'layui-none', STR_EMPTY = ''
    , STR_FORMDESIGN = 'formDesign', LAY_FORM_ITEM = 'layui-form-item', LAY_FORM_DIV = '</div>'
    , LAY_INLINE_CLASS = 'layui-input-inline', LAY_BLOCK_CLASS = 'layui-input-block'

    , LAY_INPUT_INLINE = '<div class="layui-input-inline">', LAY_INPUT_BLOCK = '<div class="layui-input-block">'
    , LAY_COMPONENT_MOVE = 'layui-component-move', LAY_COMPONENT_TOOLS = 'layui-component-tools'

    //主模板
    , TPL_MAIN = ['<div id="tpl_main" class="tpl_main">从左侧拖入组件进行表单设计</div>'].join('')
    , TPL_RIGHT_MAIN = ['<div id="tpl_right_main">请点击组件修改属性</div>'].join('')

    //构造器
    , Class = function (options) {
      var that = this;
      that.index = ++MODULE_FORMDESIGN_NAME.index;
      that.config = $.extend({}, that.config, MODULE_FORMDESIGN_NAME.config, options);
      that.render();
    };

  //默认配置
  Class.prototype.config = {
    id: null,
    data: [],         // 当前元素集合
    eval: '',         // 当前HTML数据 
    count: 0,         // 当前组件总数
    state: null,      // 当前活动实例
    index: [],        // 组件分类索引
    itemIndex: {},    // 子组件元素索引
    master: undefined // 主界面拖拽实例
  };

  // 重载实例
  Class.prototype.reload = function (options) {
    var that = this;

    // 防止数组深度合并
    layui.each(options, function (key, item) {
      if (layui._typeof(item) === 'array') delete that.config[key];
    });

    that.config = $.extend(true, {}, that.config, options);
    that.render();
  };

  // 语言标签
  Class.prototype.lang = {
    index: "序号",
    tag: "组件类型",
    label: "标签名",
    name: "<font color=\"red\">* </font>字段名",
    type: '表单类型',
    placeholder: '占位提示',
    default: '默认值',
    min: '最小',          // 当类型为number的时候
    max: '最大',
    data_min: '最小',     // 自动渲染组件
    data_max: '最大',
    maxlength: '文本长度', // text
    lay_verify: '验证规则',
    width: '组件宽度',
    height: '组件高度',
    lay_skin: '样式',
    labelhide: '隐藏标签',
    labelwidth: '文本宽度',
    uploadtype: '上传样式',
    readonly: "只读属性",
    disabled: "禁用表单",
    required: "必填项",
    lay_search: '搜索模式',
    data_datetype: "日期类型",
    options: "选项",
    data_maxvalue: "最大值",
    data_minvalue: "最小值",
    data_dateformat: "显示格式",
    data_half: "显示半星",
    theme: "皮肤",
    data_theme: "主题",
    data_color: "颜色",
    data_length: "星星个数",
    interval: "间隔毫秒",
    data_range: '左右面板',
    data_step: '步长',
    data_input: '输入框',
    data_showstep: '显示断点',
    data_default: '默认值',
    data_value: '选项值',
    data_parents: '关联父类',

    tips: '文字提示',
    size: '文件大小',
    data_size: '文件大小',
    data_accept: '上传类型',
    msg: '消息提示',
    offset: '提示位置',
    btnsize: '按钮大小',
    text: '文本',
    textarea: '多行文本',
    border: '分割线',
    column: '栅格列数',
  }

  // 组件属性
  Class.prototype.fields = {
    input: {
      index: '-1',
      tag: 'input',
      label: "单行文本",
      name: '-1',
      type: 'text',
      placeholder: "请输入",
      default: '',
      labelwidth: '110',
      width: 100,
      maxlength: '',
      min: 0,
      max: 0,
      required: false,
      readonly: false,
      disabled: false,
      labelhide: false,
      lay_verify: ''
    },
    textarea: {
      index: '-1',
      tag: 'textarea',
      name: '-1',
      label: "多行文本",
      placeholder: "请输入",
      default: '',
      maxlength: '',
      labelwidth: 110,
      width: 100,
      required: false,
      readonly: false,
      disabled: false,
      labelhide: false
    },
    radio: {
      index: '-1',
      tag: "radio",
      name: '-1',
      label: "单选框",
      labelwidth: 110,
      width: 100,
      disabled: false,
      labelhide: false,
      options: [
        {
          title: '男',
          value: '1',
          checked: true,
        },
        {
          title: '女',
          value: '0',
          checked: false,
        }
      ]
    },
    checkbox: {
      index: '-1',
      tag: "checkbox",
      name: '-1',
      label: "多选框",
      lay_skin: 'primary',
      labelwidth: 110,
      width: 100,
      disabled: false,
      labelhide: false,
      options: [
        {
          title: '写作',
          value: 'write',
          checked: true,
        },
        {
          title: '阅读',
          value: 'read',
          checked: true,
        },
        {
          title: '游戏',
          value: 'game',
          checked: false,
        }
      ]
    },
    select: {
      index: '-1',
      tag: "select",
      name: '-1',
      label: "下拉框",
      labelwidth: 110,
      width: 100,
      lay_search: false,
      disabled: false,
      required: false,
      labelhide: false,
      options: [
        {
          title: '选项1',
          value: '1',
          checked: false,
        },
        {
          title: '选项2',
          value: '2',
          checked: true,
        },
        {
          title: '选项3',
          value: '3',
          checked: false,
        }
      ]
    },
    date: {
      index: '-1',
      tag: "date",
      name: '-1',
      label: "日期组件",
      labelwidth: 110,
      width: 100,
      data_datetype: "datetime", // year month date time datetime = select
      data_dateformat: "yyyy-MM-dd HH:mm:ss",
      placeholder: 'yyyy-MM-dd',
      data_maxvalue: "9999-12-31",
      data_minvalue: "1900-01-01",
      data_range: false,        // switch
      readonly: false,
      disabled: false,
      required: false,
      labelhide: false,
    },
    colorpicker: {
      index: '-1',
      tag: "colorpicker",
      name: '-1',
      label: "颜色选择器",
      labelwidth: 110,
      width: 100,
      disabled: false,
      required: false,
      labelhide: false,
    },
    slider: {
      index: '-1',
      tag: "slider",
      name: '-1',
      label: "滑块",
      labelwidth: 110,
      width: 100,
      data_max: 100,
      data_min: 0,
      data_step: 1,
      data_default: 10,
      data_theme: '#1890ff',
      data_input: false,
      data_showstep: false,
      disabled: false,
      labelhide: false,
    },
    rate: {
      index: '-1',
      tag: "rate",
      name: '-1',
      label: "评分",
      labelwidth: 110,
      width: 100,
      data_default: 1,
      data_length: 5,
      data_half: false,
      data_theme: '#1890ff',
      readonly: false,
      labelhide: false,
    },
    switch: {
      index: '-1',
      tag: "switch",
      name: '-1',
      label: "开关",
      labelwidth: 110,
      width: 100,
      disabled: false,
      labelhide: false,
    },
    cascader: {
      index: '-1',
      tag: "cascader",
      name: '-1',
      label: "级联选择器",
      data_value: "label", // 默认为标签
      labelwidth: 110,
      width: 100,
      data_parents: true,
      labelhide: false
    },
    editor: {
      index: '-1',
      tag: "editor",
      name: '-1',
      label: "编辑器",
      labelwidth: 110,
      width: 100,
      labelhide: false
    },
    upload: {
      index: '-1',
      tag: "upload",
      name: '-1',
      label: "文件上传",
      uploadtype: 'file',
      labelwidth: 110,
      width: 100,
      data_size: 102400,
      data_accept: 'file',       // 文件 音频 视频 images
      disabled: false,
      required: false,
      labelhide: false
    },
    tags: {
      index: '-1',
      tag: "tags",
      name: '-1',
      label: "关键词",
      labelwidth: 110,
      width: 100,
      labelhide: false,
    },
    json: {
      index: '-1',
      tag: "json",
      name: '-1',
      label: "数组组件",
      labelwidth: 110,
      width: 100,
      labelhide: false,
    },
    tips: {
      index: '-1',
      tag: "tips",
      name: '-1',
      msg: '消息提示',
      offset: 4,
    },
    button: {
      index: '-1',
      tag: "button",
      name: '-1',
      text: '按钮',
      theme: '',
      btnsize: '',
    },
    note: {
      index: '-1',
      tag: "note",
      name: '-1',
      textarea: '便签信息',
      width: 100,
    },
    subtraction: {
      index: '-1',
      tag: "subtraction",
      name: '-1',
      border: '',
      width: 100,
    },
    space: {
      index: '-1',
      tag: "space",
      name: '-1',
      height: 10, // 像素
    },
    tab: {
      index: '-1',
      tag: "tab",
      name: '-1',
      options: [
        {
          title: '选项1',
          value: 'tab1',
          checked: true,
        },
        {
          title: '选项2',
          value: 'tab2',
          checked: false,
        },
      ],
      children: [
        {
          children: []
        },
        {
          children: [],
        },
      ]
    },
    grid: {
      index: '-1',
      tag: "grid",
      name: '-1',
      column: 2,
      children: [
        {
          children: []
        },
        {
          children: [],
        },
      ]
    },

  };

  // 获取组件JSON数据
  Class.prototype.getComponentJson = function (name) {

    var type = this.fields[name];
    try {
      return JSON.parse(JSON.stringify(type));
    } catch (error) {
      console.warn(name + ' is not existing');
    }
    return type;
  }

  // 初始化渲染
  Class.prototype.render = function () {
    var that = this
      , options = that.config;
    options.id = options.elem.replace('#', '');

    // 获取当前元素
    var othis = options.elem = $(options.elem);
    if (!othis[0]) return;

    $('#Propertie').html(TPL_RIGHT_MAIN);
    var arrs = ['sort_1', 'sort_2', 'sort_3'];
    for (let index = 0; index < arrs.length; index++) {
      const element = arrs[index];
      const getById = document.getElementById(element);
      that.config.index[element] = new Sortable(getById, {
        group: {
          name: STR_FORMDESIGN,
          pull: 'clone',
          put: false,
        },
        sort: false,
        animation: 150,
        onChoose: function (evt) { },  // 拖动前显示
        onAdd: function (evt) { },     // 添加到这里
        onEnd: function (evt) { },     // 拖动结束
      });
    }

    // 主要接口
    options.master = new Sortable(document.getElementById(options.id), {
      group: {
        name: STR_FORMDESIGN,
      },
      animation: 150,
      ghostClass: "sortableghost",
      chosenClass: "sortablechosen",
      swapClass: 'highlight',
      filter: function (evt, item) {

        if ($(item).hasClass('layui-tab')) {
          return true;
        }

        if ($(item).hasClass('tpl_main')) {
          return true;
        }

        if ($(item).data('type') == 'space') {
          return true;
        }

        return false;
      },
      onAdd: function (evt) {
        // FIX-BUG
        if (!options.count) {
          evt.newIndex = options.count;
        }
        var item = evt.item, id = $(item).attr('id');
        var data = that.getComponentJson($(item).data('tag'));
        if (typeof id != 'undefined') {
          data = JSON.parse(JSON.stringify(that.recursiveFindElem(options.data, id)));
          that.recursiveDelete(options.data, id);
        }

        data.index = options.count++;
        data.name = data.tag + '_' + data.index;
        options.data.splice(evt.newIndex, 0, data);
        options.state = data;
        that.renderComponent(options.data, $('#' + options.id));
      },
      onUpdate: function (evt) {
        if (evt.to.id == options.id) {
          [options.data[evt.newIndex], options.data[evt.oldIndex]] = [options.data[evt.oldIndex], options.data[evt.newIndex]];
        }
      },
      onEnd: function (evt) { }
    });

    // 查询下当前data的数据信息，是否为字符串
    if (typeof options.eval == 'string') {
      try {
        var data = JSON.parse($(options.eval).val());
        options.data = data;
        options.state = data[0];
        options.count = data.length;
        that.reloadComponent();
      } catch (error) {
        othis.append(TPL_MAIN);
        // layer.msg('初始化','info');
      }
    }
    else {
      othis.append(TPL_MAIN);
    }

    that.events();
  };

  //事件
  Class.prototype.events = function () {

    var that = this, options = that.config;
    $('body').on('click', '#formBuilder ul li', function (e) {
      var othis = $(this), index = $(othis).index(),
        parentId = $(othis).parents('#layui-tab').parent().attr('id');
      var element = that.recursiveFindElem(options.data, parentId);
      try {
        // 切换选项卡状态
        for (var key = 0; key < element.options.length; key++) {
          var subElem = element.options[key];
          if (key == index) {
            subElem.checked = true;
          } else {
            subElem.checked = false;
          }
        }
      } catch (error) { console.log(index, parentId); }
    })

    // 解析组件属性
    $('body').on('click', '#' + options.id + ' .layui-form-item', function (e) {

      // 禁止冒泡 
      // 过滤元素中按钮
      if ($(e.toElement).hasClass('layui-btn') == false
        && $(e.toElement).hasClass('layui-upload-file') == false
        && $(e.toElement).parent().hasClass('layui-tab-title') == false) {
        e.preventDefault();
        e.stopPropagation();
      }

      var othis = $(this), name = othis.attr('id');
      if (typeof name == 'undefined') {
        return true;
      }
      $('div.active').each(function (k, n) {
        $(n).removeClass('active');
      })
      $(othis).addClass('active');
      options.state = that.recursiveFindElem(options.data, name);
      that.getPropertieValues(options.state);
    })

    // 复制节点
    $('body').on('click', '#' + options.id + ' .layui-icon-picture-fine', function (e) {
      var othis = this;
      var copyElem = [];
      var name = $(othis).parents('.' + LAY_FORM_ITEM).attr('id');

      var cycleElem = function (array, name) {
        for (let index = 0; index < array.length; index++) {

          const element = array[index];
          if (element.name == name) {
            copyElem = JSON.parse(JSON.stringify(element));
            copyElem.index = options.count++;;
            copyElem.name = copyElem.tag + '_' + copyElem.index;

            // 节点插入
            array.splice(index + 1, 0, copyElem);
            break;
          }

          if (typeof element.children != 'undefined'
            && element.children.length) {
            var subElem = element.children;
            for (let i = 0; i < subElem.length; i++) {
              if (subElem[i].children.length) {
                var item = cycleElem(subElem[i].children, name);
                if (item != [] && typeof item != 'undefined') {
                  return item;
                }
              }
            }
          }
        }
      }

      cycleElem(options.data, name);
      options.state = copyElem;

      // 复制BUG 需要去重
      var nodes = [];
      var randRepeat = function (array) {
        for (let index = 0; index < array.length; index++) {

          var element = array[index];
          if (nodes.indexOf(element.name) != -1) {
            element.name = element.name + 't';
          }
          nodes.push(element.name);
          if (typeof element.children != 'undefined'
            && element.children.length) {
            var subElem = element.children;
            for (let i = 0; i < subElem.length; i++) {
              if (subElem[i].children.length) {
                randRepeat(subElem[i].children);
              }
            }
          }
        }
      }

      randRepeat(options.data);
      that.reloadComponent();
    })

    // 删除节点
    $('body').on('click', '#' + options.id + ' .layui-icon-delete', function (e) {
      var othis = this;
      layer.confirm('确定要删除元素吗？', {
      }, function (index, layero) {
        var name = $(othis).parents('.' + LAY_FORM_ITEM).attr('id');

        // 点击删除后，返回为未定义
        options.state = that.recursiveDelete(options.data, name) || [];
        that.reloadComponent();
        layer.close(index);
      })
    })

    // 当前EVAL存在则进行数据赋值
    $('body').on('click', function (e) {
      try {
        if ($(options.eval).length) {
          $(options.eval).val(JSON.stringify(options.data));
        }
      } catch (error) {
        console.warn(error);
      }
    })

    // 编辑标签
    $('body').on('keyup', '#Propertie #label', function (e) {
      $('#' + options.state.name).find('label:eq(0)').text($(this).val());
      var element = that.recursiveFindElem(options.data, options.state.name);
      element.label = $(this).val();
    })

    // 占位提示
    $('body').on('keyup', '#Propertie #placeholder', function (e) {
      $('#' + options.state.name).find(options.state.tag + ':eq(0)').prop('placeholder', $(this).val());
      var element = that.recursiveFindElem(options.data, options.state.name);
      element.placeholder = $(this).val();
    })

    // layui-change 更新后操作
    // layui-keyup 键入后操作
    $('body').on('change', '#Propertie .layui-change', function (e) {
      var othis = this;
      var oid = $(othis).attr('id');
      var oval = $(othis).val();
      if (oid == 'name') {
        var existing = that.recursiveFindElem(options.data, oval);
        if (oval.length <= 1 || existing) {
          layer.msg('Logo is shorter or already exist', 'error');
          return false;
        }
      }

      var element = that.recursiveFindElem(options.data, options.state.name);
      try {
        if (typeof element[oid] != 'undefined') {
          element[oid] = oval;
        }
      } catch (error) {
        console.log('undefined element');
      }

      that.reloadComponent();
    })

    // 图片上传类型修改
    $('body').on('click', '#Propertie #uploadtype', function (e) {
      var othis = this;
      var oval = $(othis).attr('value');
      var element = that.recursiveFindElem(options.data, options.state.name);
      try {
        element.uploadtype = oval;
      } catch (error) {
        console.log('undefined element');
      }
      $('#Propertie #uploadtype').each(function (i, e) {
        $(e).prop('class', 'layui-badge layui-bg-gray');
      })
      $(othis).prop('class', 'layui-badge layui-bg-blue');

      that.reloadComponent();
    })

    // 级联选择器类型
    $('body').on('click', '#Propertie #data_value', function (e) {
      var othis = this;
      var oval = $(othis).attr('value');
      var element = that.recursiveFindElem(options.data, options.state.name);
      try {
        element.data_value = oval;
      } catch (error) {
        console.log('undefined element');
      }
      $('#Propertie #data_value').each(function (i, e) {
        $(e).prop('class', 'layui-badge layui-bg-gray');
      })
      $(othis).prop('class', 'layui-badge layui-bg-blue');

      that.reloadComponent();
    })

    // 全局SELECT属性
    form.on('select(componentSelected)', function (data) {
      var field = $(data.elem).data('field')
        , element = that.recursiveFindElem(options.data, options.state.name);
      try {

        if (element.tag == 'grid') {
          var children = element.children;
          var length = children.length;
          if (data.value > length) {
            // 添加元素
            children.push({ children: [] });
          } else if (data.value < length) {

            var d = length - data.value;
            for (var i = 0; i < children.length; i++) {
              if (d <= 0) {
                break;
              }
              // 当前无子类
              if (!children[i].children.length) {
                d--;
                children.splice(i, 1);
              }
            }

            // 如果过滤完还有的话
            // 则还需要循环下
            if (d >= 1) {
              while (d) {
                d--;
                children.splice(d, 1);
              }
            }
          }
        }
        element[field] = data.value;
      } catch (error) {
        console.warn('undefined element');
      }

      console.log(element);
      that.reloadComponent();
    })

    // 全局组件状态
    form.on('switch(componentChecked)', function (data) {
      var field = $(this).data('field')
        , element = that.recursiveFindElem(options.data, options.state.name);
      try {
        // 过滤主题
        if (field == 'lay_skin') {
          element.lay_skin = data.elem.checked ? 'primary' : STR_EMPTY;
        } else {
          element[field] = data.elem.checked ? true : false;
        }
      } catch (error) {
        console.log('undefined element');
      }
      that.reloadComponent();
    })

    // 其他验证规则
    form.on('checkbox(verify)', function (data) {
      that.setInputVerify(data.elem.checked, $(this).val());
      var element = that.recursiveFindElem(options.data, options.state.name);
      var verify = element.lay_verify == '' ? [] : element.lay_verify.split('|');
      if (data.elem.checked) {
        verify.push(data.value);
      } else {
        verify.splice(data.value, 1);
      }

      element.lay_verify = verify.join('|');
    })

    // 添加选项
    $('body').on('click', 'button.layui-add-option', function (click) {
      that.checkSelectRadio(options.state.tag, $('#Propertie #name').val(), null);
    })

    // 编辑radio checkbox 组件信息
    $('body').on('change', '#form-options input', function (click) {

      var othis = $(this), parentIndex = $(othis).parent('.' + LAY_INLINE_CLASS).index(),
        selfIndex = $(othis).index() - 1, val = $(othis).val(), field = $('#field').val();
      var element = that.recursiveFindElem(options.data, options.state.name);
      for (const key in element.options) {
        if (key == parentIndex) {
          var item = element.options[key];
          if (selfIndex) {
            item.value = val;
          } else {
            item.title = val;
          }
        }
      }

      that.reloadComponent();
    })

    // 删除选项
    $('body').on('click', '#form-options .layui-icon-subtraction', function (click) {
      that.checkSelectRadio(options.state.tag, $('#Propertie #name').val(), $(this).prev().val(), false);
    })

    // 预览表单
    $('body').on('click', '.layui-btn-component', function (e) {

      var othis = this, subHtml = STR_EMPTY,
        formname = $('#formname').val(),
        html = '<div class="layui-fluid"><form id="' + formname + '" class="layui-form">';
      html += $('#formBuilder').html();
      html += '</form></div>';
      html = html.replace(/<ol[^>]+>/g, '').replace(/<\/ol>/g, '');
      html = html.replace(/<div class="layui-component-tools">.*?<\/div>/g, '');
      // 获取提交代码
      subHtml = html.substring(0, html.indexOf('</form>'));
      subHtml += '<div class="layui-footer layui-form-item layui-center">';
      subHtml += '<button class="layui-btn layui-btn-primary" type="button" sa-event="closeDialog">取消</button>';
      subHtml += '<button class="layui-btn lay-submit" onclick="javascript:layer.msg(\'提交测试\');" type="button" >提交</button>';
      subHtml += '</div>';
      subHtml += html.substring(html.indexOf('</form>'));
      html = subHtml;

      var formWidth = $('#formWidth').val();
      if (formWidth) {
        formWidth += 'px';
      } else {
        formWidth = '65%';
      }

      var formHeight = $('#formHeight').val();
      if (formHeight) {
        formHeight += 'px';
      } else {
        formHeight = '65%';
      }

      layer.open({
        type: 1,
        title: '预览表单 - ' + formname,
        maxmin: true,
        area: [formWidth, formHeight],
        content: html,
        success: function (index, layero) {
          // 暂时只渲染layui元素
          // 剩下的需要在自身页面进行渲染
          form.render();
        }
      })
    })

    // 清空表单设计
    $('body').on('click', '.layui-form-clear', function (e) {
      layer.confirm('确定要清空表单设计吗？', {
      }, function (index, layero) {
        options.data = [];
        $('#' + options.id).html(TPL_MAIN);
        $('#Propertie').html(TPL_RIGHT_MAIN);
        layer.close(index);
      })
    })

    // 导出表单
    $('body').on('click', '.layui-btn-export', function (e) {

      $('#json-code').val(JSON.stringify(options.data, null, 4));
      $('#import-code').addClass(STR_HIDE);
      $('#copy-code').removeClass(STR_HIDE);
      layer.open({
        type: 1
        , offset: '130px'
        , content: $('.layui-htmlview')
        , area: ['800px', '660px']
        , shade: false
        , resize: false
        , success: function (layero, index) { }
      });
    })

    // 复制代码
    $('body').on('click', '#copy-code', function (e) {
      var data = document.getElementById("json-code");
      data.select();
      if (document.execCommand('copy')) {
        layer.msg('复制成功');
      }

      layer.closeAll();
    })

    // 导入表单
    $('body').on('click', '.layui-btn-import', function (e) {
      $('#copy-code').addClass(STR_HIDE);
      $('#import-code').removeClass(STR_HIDE);
      layer.open({
        type: 1
        , offset: '130px'
        , content: $('.layui-htmlview')
        , area: ['800px', '660px']
        , shade: false
        , resize: false
        , success: function (layero, index) {
          $('body').on('click', '#import-code', function (e) {
            try {
              var data = $('#json-code').val();
              options.data = JSON.parse(data);
              options.state = options.data[0];
              that.reloadComponent();
              layer.close(index);
            } catch (error) {
              layer.msg('缺少参数', 'error');
            }
          })
        }
      });
    })

    // 加载表单
    $('body').on('click', '.button--text', function (e) {
      var id = $(this).data('id');
      layer.confirm('是否加载这个模板？加载后会覆盖设计器当前表单', function (index) {
        $(layer).find('.layui-layer-btn0').css('pointer-events', 'none');
        $.ajax({
          url: '//api.swiftadmin.net/form/read?id=' + id,
          type: "get",
          data: [],
          success: function (res) {
            if (res.code == 200) {
              options.data = JSON.parse(res.data);
              options.state = options.data[0];
              that.reloadComponent();
            }
          }
        });
        layer.close(index);
      })
    })
  };

  /**
   * 增删组件选项
   * @param {*} tag 
   * @param {*} name 
   * @param {*} value 
   * @param {*} action 
   */
  Class.prototype.checkSelectRadio = function (tag, name, value, action = true) {
    var options = this.config;
    var element = this.recursiveFindElem(options.data, name);
    if (action) {

      element.options.splice(element.options.length, 0, {
        title: '选项' + element.options.length,
        value: 'value',
        checked: false
      });

      if (element.tag == 'tab') {
        element.children.push({ children: [] });
      }

    } else {
      for (const key in element.options) {
        var item = element.options[key];
        if (item.value == value) {
          element.options.splice(key, 1);
          if (element.tag == 'tab') {
            element.children.splice(key, 1);
          }
          break;
        }
      }
    }

    this.reloadComponent();
  }

  /**
   * 设置表单验证规则
   * @param {*} checked 
   * @param {*} field 
   */
  Class.prototype.setInputVerify = function (checked = false, field = '') {

    var elem = this.config.state.name;
    var rules = $('#' + elem).find('input:eq(0)').attr('lay-verify') || [];
    if (typeof rules != 'object') {
      rules = rules.split('|');
    }
    if (checked) {
      rules[rules.length] = field;
      $('#' + elem).find('input:eq(0)').attr('lay-verify', rules.join('|'));
    } else {
      for (let index = 0; index < rules.length; index++) {
        const el = rules[index];
        if (el == field) {
          rules.splice(index, 1);
        }
      }
      if (rules.length) {
        $('#' + elem).find('input:eq(0)').attr('lay-verify', rules.join('|'));
      }
      else {
        $('#' + elem).find('input:eq(0)').removeAttr('lay-verify');
      }
    }
  }

  /**
   * 获取HTML代码
   * @param {*} lable 
   * @param {*} id 
   * @param {*} value 
   * @param {*} classed 
   */
  Class.prototype.getPropertieHtml = function (lable, id, value, classed = '', attr = '') {
    var proHtml = '<div class="' + LAY_FORM_ITEM + '">';

    if (lable) {
      proHtml += '<label class="layui-form-label">' + lable + '</label>';
    }

    proHtml += LAY_INPUT_INLINE;
    proHtml += '<input type="text"';
    if (id) {
      proHtml += 'id="' + id + '"';
    }
    proHtml += 'class="layui-input ' + classed + '"';
    proHtml += 'value="' + value + '" ' + attr + '>';

    proHtml += LAY_FORM_DIV + LAY_FORM_DIV;
    return proHtml;
  }

  /**
   * 模板碎片
   * @param {*} lable 
   * @returns 
   */
  Class.prototype.getPropertieDebris = function (lable, hide = '') {
    var proHtml = '<div class="' + LAY_FORM_ITEM + ' ' + hide + '">';
    if (lable) {
      proHtml += '<label class="layui-form-label">' + lable + '</label>';
    }
    proHtml += LAY_INPUT_INLINE;
    return proHtml;
  }

  /**
   * 获取标签文字
   * @param {*} field 
   */
  Class.prototype.getLang = function (field) {
    if (typeof this.lang[field] != 'undefined') {
      return this.lang[field];
    }
    else {
      return field + ' undefined';
    }
  }

  /**
   * 获取表单属性
   * @param {*} elem 
   * @param {*} type 
   */
  Class.prototype.getPropertieValues = function (data, type) {

    var that = this,
      options = that.config,
      optionsHtml = STR_EMPTY;
    for (const key in data) {
      // 过滤index
      if (key == 'index') {
        continue;
      }

      var value = data[key];
      if (key == 'options' || key == 'children') {
        // 过滤信息
      }
      else {
        optionsHtml += that.getPropertieDebris(that.getLang(key));
      }
      switch (key) {
        case 'tag':
          optionsHtml += '<input class="layui-input layui-disabled" disabled value="' + value + '" data-type="' + key + '">';
          break;
        case 'label':
        case 'placeholder': // 标签和描述占位符
          optionsHtml += '<input class="layui-input layui-keyup" value="' + value + '" id="' + key + '">';
          break;
        case 'name':
        case 'msg':
        case 'text':
        case 'color':
        case 'default':
        case 'data_default':
        case 'data_theme':
          optionsHtml += '<input class="layui-input layui-change" value="' + value + '" id="' + key + '">';
          break;
        case 'type':
          optionsHtml += '<select lay-filter="componentSelected" data-field="type">';
          var inputType = [
            {
              title: '文本',
              value: 'text',
            },
            {
              title: '密码',
              value: 'password',
            },
            {
              title: '数字',
              value: 'number',
            },
          ];
          for (let index = 0; index < inputType.length; index++) {
            const element = inputType[index];
            optionsHtml += '<option value="' + element.value + '"';
            if (element.value == data.type) {
              optionsHtml += 'selected';
            }
            optionsHtml += '>' + element.title + '</option>';
          }
          optionsHtml += '</select>';
          
          break;
        case 'data_datetype':
          optionsHtml += '<select lay-filter="componentSelected" data-field="data_datetype" >';
          var date_types = [
            {
              title: '默认',
              value: 'date',
            },
            {
              title: '年选择器',
              value: 'year',
            },
            {
              title: '年月选择器',
              value: 'month',
            },
            {
              title: '时间选择器',
              value: 'time',
            },
            {
              title: '日期时间选择器',
              value: 'datetime',
            },
          ];
          for (var index in date_types) {
            const element = date_types[index];
            optionsHtml += '<option value="' + element.value + '"';
            if (element.value == data.data_datetype) {
              optionsHtml += 'selected';
            }
            optionsHtml += '>' + element.title + '</option>';
          }
          optionsHtml += '</select>';
          break;
        case 'data_dateformat':
          optionsHtml += '<select lay-filter="componentSelected" data-field="data_dateformat" >';
          var dateformat = ['yyyy-MM-dd HH:mm:ss', 'yyyy年MM月dd日', 'dd/MM/yyyy', 'yyyyMM', 'H点M分', 'yyyy-MM', 'yyyy年M月d日H时m分s秒'];
          for (var index in dateformat) {
            const element = dateformat[index];
            optionsHtml += '<option value="' + element + '"';
            if (element == data.data_dateformat) {
              optionsHtml += 'selected';
            }
            optionsHtml += '>' + element + '</option>';
          }
          optionsHtml += '</select>';
          break;
        case 'offset':
          var attrs = { 1: '上', 2: '左', 3: '下', 4: '右' };
          optionsHtml += '<select lay-filter="componentSelected" data-field="offset" >';
          for (const key in attrs) {
            optionsHtml += '<option value="' + key + '" ';
            if (key == data.offset) {
              optionsHtml += 'selected';
            }
            optionsHtml += '>' + attrs[key] + '</option>';
          }
          optionsHtml += '</select>';
          break;
        case 'theme':
          var attrs = {
            '': '默认',
            'layui-btn-normal': '百搭',
            'layui-btn-warm': '暖色',
            'layui-btn-danger': '警告',
            'layui-btn-disabled': '禁用'
          };
          optionsHtml += '<select lay-filter="componentSelected" data-field="theme">';
          for (const key in attrs) {
            optionsHtml += '<option value="' + key + '" ';
            if (key == data.theme) {
              optionsHtml += 'selected';
            }
            optionsHtml += '>' + attrs[key] + '</option>';
          }
          optionsHtml += '</select>';
          console.log(123);
          break;
        case 'btnsize':
          var attrs = {
            '': '默认按钮',
            'layui-btn-lg': '大型按钮',
            'layui-btn-sm': '小型按钮',
            'layui-btn-xs': '迷你按钮',
            'layui-btn-fluid': '流体按钮'
          };
          optionsHtml += '<select lay-filter="componentSelected" data-field="btnsize">';
          for (const key in attrs) {
            optionsHtml += '<option value="' + key + '" ';
            if (key == data.btnsize) {
              optionsHtml += 'selected';
            }
            optionsHtml += '>' + attrs[key] + '</option>';
          }
          optionsHtml += '</select>';
          break;
        case 'data_accept':
          optionsHtml += '<select lay-filter="componentSelected" data-field="data_accept">';
          var arr = [
            {
              title: '文件',
              value: 'file',
            },
            {
              title: '视频',
              value: 'video',
            },
            {
              title: '音频',
              value: 'audio',
            },
            {
              title: '图片',
              value: 'images',
            }
          ];
          for (var index in arr) {
            const element = arr[index];
            optionsHtml += '<option value="' + element.value + '"';
            if (element.value == data.data_accept) {
              optionsHtml += 'selected';
            }
            optionsHtml += '>' + element.title + '</option>';
          }
          optionsHtml += '</select>';
          break;
        case 'max':
        case 'min':
        case 'size':
        case 'height':
        case 'data_max':
        case 'data_min':
        case 'data_step':
        case 'data_size':
          optionsHtml += '<input type="number" min="0" class="layui-input layui-change" value="' + value + '" id="' + key + '" >';
          break;
        case 'data_maxvalue':
        case 'data_minvalue':
          optionsHtml += '<input class="layui-input layui-change" value="' + value + '" id="' + key + '" >';
          break;
        case 'width': // 滑块操作
          optionsHtml += '<div data-min="20" data-max="100" id="' + key + '" class="layui-sliders" data-value="' + value + '"></div>';
          break;
        case 'labelwidth':
          optionsHtml += '<div data-min="60" data-max="255" id="' + key + '" class="layui-sliders" data-value="' + value + '"></div>';
          break;
        case 'maxlength':
          optionsHtml += '<input type="number" min="1" id="maxlength" class="layui-input layui-change" value="' + (value ? value : 255) + '">';
          break;
        case 'minmax':
          for (const key in data.minmax) {
            var num = data.minmax[key];
            optionsHtml += '<input id="' + num.title + '" type="number" class="layui-input layui-minmax" value="' + num.value + '">';
            if (key == 0) {
              optionsHtml += '<em>-</em>';
            }
          }
          break;
        case 'lay_skin':
        case 'required':
        case 'readonly':
        case 'disabled':
        case 'labelhide':
        case 'lay_search':
        case 'data_range':
        case 'data_showstep':
        case 'data_half':
        case 'data_input':
        case 'data_parents':
          optionsHtml += '<input type="checkbox" lay-skin="switch" lay-filter="componentChecked" ';
          if (data[key]) {
            optionsHtml += 'checked=""';
          }
          optionsHtml += 'data-field="' + key + '">';
          break;
        case 'data_value':
          var type = ['label', 'value'];
          for (const index in type) {
            optionsHtml += ' <span class="layui-badge ';

            if (type[index] == data.data_value) {
              optionsHtml += 'layui-bg-blue';
            } else {
              optionsHtml += 'layui-bg-gray';
            }
            optionsHtml += '" id="' + key + '" value="' + type[index] + '" >' + type[index] + '</span>';
          }
          break;
        case 'lay_verify':
          var verify = [
            {
              title: '手机',
              value: 'phone'
            },
            {
              title: '邮箱',
              value: 'email'
            },
            {
              title: '网址',
              value: 'url'
            },
            {
              title: '数字',
              value: 'number'
            },
            {
              title: '日期',
              value: 'date'
            },
            {
              title: '身份证',
              value: 'identity'
            },
          ];

          for (const key in verify) {
            var check = verify[key];
            optionsHtml += '<input type="checkbox" lay-skin="primary" lay-filter="verify" value="' + check.value + '"';
            optionsHtml += 'title="' + check.title + '"';
            if (data.lay_verify.indexOf(check.value) != -1) {
              optionsHtml += 'checked=""';
            }
            optionsHtml += '>';
          }
          break;
        case 'uploadtype':
          var type = ['file', 'images', 'multiple'];
          for (const index in type) {
            optionsHtml += ' <span class="layui-badge ';

            if (type[index] == data.uploadtype) {
              optionsHtml += 'layui-bg-blue';
            } else {
              optionsHtml += 'layui-bg-gray';
            }
            optionsHtml += '" id="' + key + '" value="' + type[index] + '" >' + type[index] + '</span>';
          }
          break;
        case 'maxlength':
        case 'data_length':
          optionsHtml += '<input type="number" min="1" id="' + key + '"  class="layui-input layui-change" value="' + value + '">';
          break;
        case 'textarea':
          optionsHtml += '<textarea class="layui-textarea layui-change" id="' + key + '" >' + value + '</textarea>';;
          break;
        case 'border':
          var attrs = {
            '': '默认',
            'layui-border-red': '赤色',
            'layui-border-orange': '橙色',
            'layui-border-green ': '墨绿色',
            'layui-border-cyan': '青色',
            'layui-border-blue': '蓝色',
            'layui-border-black': '黑色',
          };
          optionsHtml += '<select lay-filter="componentSelected" data-field="border">';
          for (const key in attrs) {
            optionsHtml += '<option value="' + key + '" ';
            if (key == data.border) {
              optionsHtml += 'selected';
            }
            optionsHtml += '>' + attrs[key] + '</option>';
          }
          optionsHtml += '</select>';
          break;
        case 'options':
          optionsHtml += this.formOptionHeader();
          for (const key in data.options) {
            var option = data.options[key];
            optionsHtml += LAY_INPUT_INLINE;
            optionsHtml += '<i class="layui-icon layui-icon-slider"></i>';
            optionsHtml += '<input class="layui-input" value="' + option.title + '" >';
            optionsHtml += '<input class="layui-input" value="' + option.value + '" >';
            optionsHtml += '<i class="layui-icon layui-icon-subtraction"></i>';
            optionsHtml += LAY_FORM_DIV;
          }
          optionsHtml += '<div class="layui-input-inline layui-inlioc">';
          optionsHtml += '<button type="button" class="layui-btn layui-btn-xs layui-add-option">添加</button>';
          optionsHtml += LAY_FORM_DIV
          optionsHtml += LAY_FORM_DIV + LAY_FORM_DIV;
          break;
        case 'column':
          var attrs = [2, 3, 4];
          optionsHtml += '<select lay-filter="componentSelected" data-field="column">';
          for (const i in attrs) {
            var val = attrs[i];
            optionsHtml += '<option value="' + val + '" ';
            if (val == data.column) {
              optionsHtml += 'selected';
            }
            optionsHtml += '>' + val + '</option>';
          }
          optionsHtml += '</select>';
          break;
        default:
          break;
      }

      optionsHtml += '</div></div>';
    }

    $('#Propertie').html(optionsHtml);
    form.render(null, 'Propertie');

    // 最大化时间回调操作
    var datetime = $('#data_maxvalue, #data_minvalue');
    datetime.each(function (index, obj) {
      layui.laydate.render({
        elem: this
        , type: 'date'
        , format: 'yyyy-MM-dd'
        , done: function (value, date, endDate) {
          var element = that.recursiveFindElem(options.data, options.state.name);
          try {
            element[$(obj).attr('id')] = value;
          } catch (error) {
            console.log(error);
          }
          that.reloadComponent();
        }
      });
    })

    // 选项拖动接口
    if ($('#Propertie #form-options').length) {
      new Sortable(document.getElementById('form-options'), {
        handle: '.layui-icon-slider',
        animation: 150,
        onAdd: function (evt) { },
        onUpdate: function (evt) {
          var element = that.recursiveFindElem(options.data, options.state.name);
          try {
            var op = element.options;
            [op[evt.newIndex], op[evt.oldIndex]] = [op[evt.oldIndex], op[evt.newIndex]];

            // 是否内容区域也需要编辑？

            that.reloadComponent();
          } catch (error) {
            // 捕获异常
            console.warn(error);
          }
        },
        onEnd: function (evt) { }
      });
    }

    layui.each($(".layui-sliders"), function (key, elem) {
      var othat = $(this),
        obj = othat.attr('id'),
        val = othat.data('value'),
        min = othat.data('min') || 10,
        max = othat.data('max') || 100,
        theme = othat.data('theme') || '#1890ff';
      layui.slider.render({
        elem: elem
        , min: min
        , max: max
        , input: true
        , theme: theme
        , value: val
        , step: 2
        , change: function (value) {

          if (value <= min || isNaN(value)) {
            value = min;
          }

          var element = that.recursiveFindElem(options.data, options.state.name);
          try {
            element[obj] = value
          } catch (error) {
            console.warn(error);
          }
          that.reloadComponent();
        }
      })
    })

  }

  /**
   * 获取选项表头
   * @param {*} options 
   * @returns 
   */
  Class.prototype.formOptionHeader = function (options = 'form-options') {
    var _options = '<fieldset id="layui-elem-field" class="layui-elem-field layui-field-title">';
    _options += '<legend>选项</legend>';
    _options += ' </fieldset>';
    _options += '<div id="' + options + '" class="' + LAY_FORM_ITEM + '">';
    return _options;
  }

  /**
   * 获取工具栏HTML
   * @returns 
   */
  Class.prototype.getToolsHtml = function () {
    var tools = '<div class="' + LAY_COMPONENT_TOOLS + '">';
    tools += ' <i class="layui-icon layui-icon-picture-fine" title="复制" ></i>';
    tools += ' <i class="layui-icon layui-icon-delete" title="删除"></i>';
    tools += LAY_FORM_DIV;
    return tools;
  }

  // 获取组件代码
  Class.prototype.renderComponent = function (data, elem) {

    var that = this,
      outerHTML = STR_EMPTY,
      options = that.config;
    /**
     * 代码预处理
     * 编辑器需要预先移除节点
     */
    $(elem).find('.editorsrv').each(function (i, n) {
      $(n).parent().find('.tox-tinymce').remove();
      $(n).remove();
    });

    elem.empty(STR_EMPTY);
    // 循环渲染表单
    for (let index = 0; index < data.length; index++) {
      var element = data[index];
      outerHTML = that.renderComponentItem[element.tag].render(element);
      elem.append($(outerHTML).append(that.getToolsHtml()).prop("outerHTML"));
      switch (element.tag) {
        case 'input':
          break;
        case 'date':
          admin.components.datetime();
          break;
        case 'colorpicker':
          admin.components.colorpicker();
          break;
        case 'slider':
          admin.components.slider();
          break;
        case 'rate':
          admin.components.rate();
          break;
        case 'upload':
          admin.components.upload();
          break;
        case 'tags':
          admin.components.tags();
          break;
        case 'cascader':
          admin.components.cascader('input#' + element.name);
          break;
        case 'editor':
          tinymce.init({
            selector: '#' + element.name + '_tiny',
            language: 'zh_CN',
          })
          break;
        case 'tab':
        case 'grid':
          var children = $('#' + element.name + ' .children');
          var childItem = []
          $.each(children, function (index, item) {
            that.gridtabSortable(item);
            childItem[index] = item;
          })
          // 递归渲染里面的子元素
          $.each(element.children, function (index, item) {
            if (item.children.length) {
              that.renderComponent(item.children, $(childItem[index]));
            }
          })
          break;
        default:
          break;
      }

      if (typeof options.state != 'undefined') {
        that.getPropertieValues(options.state);
      } else if (options.data.length) {
        options.state = options.data[options.data.length - 1];
        that.getPropertieValues(options.state);
      }
    }

    // 取消其他活动选项
    $('#' + options.id + ' div.active').each(function (k, n) {
      $(n).removeClass('active');
    })

    if (typeof options.state != undefined) {
      $('div#' + options.state.name).addClass('active');
    }

    // 渲染表单
    form.render();
  }

  /**
   * 重新渲染组件
   */
  Class.prototype.reloadComponent = function () {
    this.renderComponent(this.config.data, $('#' + this.config.id));
  }

  /**
   * 是否隐藏标签
   * @param {*} labelhide 
   * @param {*} data 
   * @returns 
   */
  var getBeforeLabel = function (labelhide = false, data) {

    var labelHtml = '<label class="layui-form-label';
    if (labelhide) {
      labelHtml += ' ' + 'layui-hide';
    }

    labelHtml += '"';
    if (data.labelwidth && data.labelwidth != 110) {
      labelHtml += 'style="width:' + data.labelwidth + 'px;"';
    }

    labelHtml += '>';
    if (data.required) {
      labelHtml += '<font color="red">* </font>';
    }
    labelHtml += data.label + '</label>';
    labelHtml += '<div class="' + LAY_BLOCK_CLASS + '"';
    var styleCSS = [];
    if (labelhide) {
      styleCSS.push('margin-left:0');
    }

    // 这里存在一个BUG，应该是如果标签隐藏了，那么就不需要再次去增加就可以了，这里只是一个MLF的像素
    if (data.labelwidth && data.labelwidth != 110) {
      // 数据偏移需要增加30
      var labelwidth = Number(data.labelwidth) + 30;
      styleCSS.push('margin-left:' + labelwidth + 'px');
    }

    styleCSS = styleCSS.join(';');
    if (styleCSS) {
      labelHtml += 'style="' + styleCSS + '"';
    }

    labelHtml += '>';

    return labelHtml;
  }

  /**
   * ITEM前置模板
   * @param {IETM} data 
   * @returns 
   */
  var getBeforeItem = function (data) {
    var _BeforeItem = '<div id="' + data.name + '" class="layui-form-item" data-index="' + data.index + '" data-tag="' + data.tag + '"';

    if (data.width && data.width != 100) {
      _BeforeItem += 'style="width:' + data.width + '%"';
    }

    _BeforeItem += '>';
    return _BeforeItem;
  }

  // 渲染组件HTML
  Class.prototype.renderComponentItem = {
    input: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);

        html += '<input type="' + data.type + '" name="' + data.name + '" class="layui-input"';
        html += 'value="' + data.default + '" placeholder="' + data.placeholder + '"';

        // 限定数字格式
        if (data.type == 'number') {

          if (data.min) {
            html += 'min="' + data.min + '"';
          }
          if (data.max) {
            html += 'max="' + data.max + '"';
          }

        } else {
          if (data.maxlength) {
            html += 'maxlength="' + data.maxlength + '"';
          }
        }

        // 禁用只读表单
        if (data.readonly) {
          html += 'readonly=""';
        }

        if (data.disabled) {
          html += 'disabled=""';
        }

        if (data.lay_verify) {
          html += 'lay-verify="' + data.lay_verify + '"';
        }

        html += '>';
        html += '</div></div>';
        return html;
      },


    },
    textarea: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);
        html += '<textarea name="' + data.name + '" class="layui-textarea" placeholder="' + data.placeholder + '"';

        if (data.required) {
          html += 'lay-verify="required"';
        }
        if (data.readonly) {
          html += 'readonly=""';
        }
        if (data.disabled) {
          html += 'disabled=""';
        }

        if (data.maxlength && data.maxlength != 255) {
          html += 'maxlength="' + data.maxlength + '"';
        }

        html += '></textarea>';
        html += '</div></div>';
        return html;
      }
    },
    radio: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);
        if (data.options.length) {
          for (let index = 0; index < data.options.length; index++) {
            var elem = data.options[index];
            html += '<input type="radio" name="' + data.name + '" value="' + elem.value + '" title="' + elem.title + '"';
            if (elem.checked) {
              html += 'checked=""';
            }
            if (data.disabled) {
              html += 'disabled=""';
            }

            html += '>';
          }
        }

        html += '</div></div>';
        return html;
      }
    },
    checkbox: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);
        if (data.options.length) {
          for (let index = 0; index < data.options.length; index++) {
            var elem = data.options[index];
            var name = data.name;
            if (data.name) {
              name += '[' + elem.value + ']';
            }
            html += '<input type="checkbox" name="' + name + '" lay-skin="' + data.lay_skin + '" value="' + elem.value + '" title="' + elem.title + '"';
            if (elem.checked) {
              html += 'checked=""';
            }
            if (data.disabled) {
              html += 'disabled=""';

            }
            html += '>';
          }
        }
        html += '</div></div>';
        return html;
      }
    },
    select: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);
        html += '<select name="' + data.name + '"';

        if (data.searchMode) {
          html += 'lay-search=""';
        }

        if (data.required) {
          html += 'lay-verify="required"';
        }

        if (data.disabled) {
          html += 'disabled=""';
        }

        html += '>';
        html += '<option value="">请选择</option>';
        if (data.options.length) {
          for (let index = 0; index < data.options.length; index++) {
            var elem = data.options[index];
            html += '<option value="' + elem.value + '">' + elem.title + '</option>';
          }
        }
        html += '</select>';
        html += '</div></div>';
        return html;
      }
    },
    date: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);

        html += '<input type="text" name="' + data.name + '" class="layui-input" placeholder="' + data.placeholder + '" lay-datetime=""';

        if (data.data_range) {
          html += 'data-range="true"';
        }

        if (data.data_datetype) {
          html += 'data-datetype="' + data.data_datetype + '"';
        }

        if (data.data_dateformat) {
          html += 'data-dateformat="' + data.data_dateformat + '"';
        }

        if (data.data_maxvalue) {
          html += 'data-maxvalue="' + data.data_maxvalue + '"';
        }
        if (data.data_minvalue) {
          html += 'data-minvalue="' + data.data_minvalue + '"';
        }

        if (data.required) {
          html += 'lay-verify="required"';
        }

        if (data.disabled) {
          html += 'disabled=""';
        }
        if (data.readonly) {
          html += 'readonly=""';
        }

        html += '>';
        html += '</div></div>';
        return html;
      }
    },
    colorpicker: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);
        html += '<input class="layui-input layui-hide ' + data.name + '" name="' + data.name + '"/>';
        html += '<div lay-colorpicker="' + data.name + '" data-value="' + data.default + '"></div>';
        html += '</div></div>';
        return html;
      }
    },
    slider: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);
        html += '<input class="layui-input layui-hide ' + data.name + '" name="' + data.name + '"/>';
        html += '<div class="lay-slider" lay-slider="slider" data_default="' + data.data_default + '" data-theme="' + data.data_theme + '"';

        if (data.data_showstep) {
          html += 'data-showstep="' + data.data_showstep + '"';
        }

        if (data.data_step) {
          html += 'data-step="' + data.data_step + '"';
        }

        if (data.data_max) {
          html += 'data-max="' + data.data_max + '"';
        }
        if (data.data_min) {
          html += 'data-min="' + data.data_min + '"';
        }

        if (data.data_input) {
          html += 'data-input="' + data.data_input + '"';
        }

        if (data.disabled) {
          html += 'disabled=""';
        }
        if (data.readonly) {
          html += 'readonly=""';
        }

        html += '></div>';
        html += '</div></div>';
        return html;
      }
    },
    rate: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);
        html += '<input class="layui-input layui-hide ' + data.name + '" name="' + data.name + '"/>';
        html += '<div lay-rate="' + data.name + '" data-default="' + data.data_default + '" data-class="' + data.name + '" data-theme="' + data.data_theme + '"';

        if (data.data_half) {
          html += 'data-half="true"';
        }

        if (data.data_length) {
          html += 'data-length="' + data.data_length + '"';
        }

        if (data.readonly) {
          html += 'data-readonly="true"';
        }

        html += '></div>';
        html += '</div></div>';
        return html;
      }
    },
    switch: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);
        html += '<input type="checkbox" name="' + data.name + '" value="1" lay-skin="switch" />';
        html += '</div></div>';
        return html;
      }
    },
    cascader: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);
        html += '<input id="' + data.name + '" class="layui-input" data-parents="' + data.data_parents + '" data-value="' + data.data_value + '">';
        html += '</div></div>';
        return html;
      }
    },
    editor: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);
        html += '<textarea id="' + data.name + '_tiny" name="' + data.name + '" class="layui-hide editorsrv" ';
        html += '></textarea>';
        html += '</div></div>';
        return html;
      }
    },
    upload: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);

        switch (data.uploadtype) {
          case 'images':
            html += '<input class="layui-input layui-input-upload ' + data.name + '" name="' + data.name + '" >';
            html += '<button type="button" class="layui-btn" lay-choose="' + data.name + '" data-type="images" >';
            html += '<i class="layui-icon layui-icon-windows"></i>选择</button>';
            html += '<div class="clear"></div>';
            html += '<div class="layui-upload-drag" lay-upload="' + data.name + '" data-type="images"';
            html += 'data-accept="' + data.data_accept + '"';
            html += 'data-size="' + data.size + '"';
            html += '>';
            html += '<i class="layui-icon"></i>';
            html += '<p>点击上传，或将文件拖拽到此处</p>';
            html += '<div class="layui-hide">';
            html += '<hr>';
            html += '<img src="" class="layui-upload-dragimg ' + data.name + '" alt="上传成功后渲染" >';

            html += '<span class="layui-badge layui-upload-clear" >删除</span>';
            html += '</div></div>';
            break;
          case 'multiple':
            html += '<div class="layui-imagesbox">';
            html += '<div class="layui-input-inline">';
            html += '<div class="layui-upload-drag" lay-upload="' + data.name + '" data-type="multiple"';
            html += 'data-accept="' + data.data_accept + '"';
            html += 'data-size="' + data.data_size + '"';
            html += '>';
            html += '<i class="layui-icon layui-icon-upload"></i>';
            html += '<p>点击上传，或将文件拖拽到此处</p>';
            html += '<div class="layui-hide"></div>';
            html += '</div>';
            html += '<button type="button" class="layui-btn layui-btn-xs layui-btn-fluid"><i class="layui-icon layui-icon-windows"></i> 选择</button>';
            html += '</div>';

            html += '</div>';
            break;
          default:

            html += '<input type="text" name="' + data.name + '" class="layui-input layui-input-upload ' + data.name + '"';

            if (data.disabled) {
              html += 'disabled=""';
            }

            if (data.required) {
              html += 'lay-verify="required"';
            }

            html += 'data-accept="' + data.data_accept + '"';
            html += 'data-size="' + data.data_size + '"';
            html += '>';
            html += '<button type="button" class="layui-btn" lay-upload="' + data.name + '" data-type="normal" >';
            html += '<i class="layui-icon layui-icon-upload"></i>上传</button>';
            html += '<button type="button" class="layui-btn ml10" lay-choose="' + data.name + '" data-type="normal" >';
            html += '<i class="layui-icon layui-icon-windows"></i>选择</button>';

            html += '</div></div>';
            break;
        }

        return html;
      }
    },
    tags: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);
        html += '<input type="text" lay-tags="" id="' + data.name + '" name="' + data.name + '" class="layui-input" >';
        html += '</div></div>';
        return html;
      }
    },
    json: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += getBeforeLabel(data.labelhide, data);
        html += '<table class="layui-table" >';
        html += '<thead>';
        html += ' <tr>';
        html += '<th>名称</th>';
        html += '<th>变量值</th>';
        html += '<th>操作</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        html += '</tbody>';
        html += '</table>';
        html += '<button type="button" class="layui-btn layui-btn-normal layui-jsonvar-add" data-name="' + data.name + '" >追加</button>';
        html += LAY_FORM_DIV;
        html += LAY_FORM_DIV;
        return html;
      }
    },
    tips: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += '<div class="' + LAY_INLINE_CLASS + '" >';
        html += ' <i class="layui-icon layui-icon-about" lay-tips="' + data.msg + '" data-offset="' + data.offset + '" ></i>';
        html += LAY_FORM_DIV;
        html += LAY_FORM_DIV;
        return html;
      }
    },
    button: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += '<div class="' + LAY_INLINE_CLASS + '" >';
        html += '<button type="button" class="layui-btn ' + data.theme + ' ' + data.btnsize + '" >' + data.text + '</button> ';
        html += LAY_FORM_DIV;
        html += LAY_FORM_DIV;
        return html;
      }
    },
    note: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += '<blockquote class="layui-elem-quote">' + data.textarea + '</blockquote>';
        html += LAY_FORM_DIV;
        return html;
      }
    },
    subtraction: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += '<hr class="' + data.border + '">';
        html += LAY_FORM_DIV;
        return html;
      }
    },
    space: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += '<div style="height:' + data.height + 'px;"></div>';
        html += LAY_FORM_DIV;
        return html;
      }
    },
    tab: {
      render: function (data) {
        var html = getBeforeItem(data);
        html += '<div id="layui-tab" id="' + data.name + '" class="layui-tab layui-tab-brief">';
        html += '<ul class="layui-tab-title">';
        var content = STR_EMPTY;
        for (var key in data.options) {
          var item = data.options[key]
          html += '<li class="' + (item.checked ? 'layui-this' : '') + '">' + item.title + '</li>';

          content += '<div id="saphp-tab' + key + '" class="layui-tab-item ' + (item.checked ? 'layui-show ' : '') + 'children" data-index="' + key + '"></div>';
        }

        html += '</ul>';
        html += '<div class="layui-tab-content">';
        html += content;
        html += '</div>';
        html += LAY_FORM_DIV;
        return html;
      }
    },
    grid: {
      render: function (data) {
        var html = '<div id="' + data.name + '" class="layui-form-item layui-row" data-index="' + data.index + '" data-tag="' + data.tag + '">';
        // 计算每一个区块大小
        if (data.children.length) {
          var col = 12 / data.column;
          for (let index = 0; index < data.column; index++) {
            var elem = data.children[index];
            html += '<div class="layui-col-md' + col + ' layui-grid-' + index + ' children" data-index="' + index + '"></div>';
          }
        }

        html += '</div>';

        return html;
      }
    },
  }

  /**
   * 渲染form表单ITEM可以拖放
   * @param {*} params 
   */
  Class.prototype.gridtabSortable = function (itemId) {

    var that = this,
      options = that.config;
    var item = new Sortable.create(itemId, {
      group: {
        name: STR_FORMDESIGN
      },
      direction: 'vertical',
      ghostClass: "sortableghost",
      animation: 150,
      swapClass: 'highlight',
      filter: function (evt, item) {
        // 限定OL标签
        // if ($(item)[0].tagName != 'OL'
        //   || $(item).data('type') == 'space') {
        //   return true;
        // }
        // console.log($(item).data('tag')); 

        return false;
      },
      onChoose: function (evt) { },
      onAdd: function (evt) {

        // 表格内禁止嵌入表格
        if ($(evt.item).data('tag') == 'tab') {
          $(evt.item).remove();
          layer.msg('禁止嵌套选项卡', 'error');
          return false;
        }

        var item = evt.item, id = $(item).attr('id'),
          parentId = $(evt.item.parentElement.parentElement).attr('id'),
          parentIndex = $(evt.item.parentElement).index();

        if (typeof parentId == 'undefined') {
          parentId = $(evt.item).parents('.layui-tab').parent().attr('id');
        }

        // 查找栅格的ID
        var gridElem = that.recursiveFindElem(options.data, parentId);

        if (typeof id != 'undefined') {
          // 创建新组件
          var data = JSON.parse(JSON.stringify(that.recursiveFindElem(options.data, id)));
          data.index = options.count++;
          data.name = data.tag + '_' + data.index;
          gridElem.children[parentIndex].children.splice(evt.newIndex, 0, data);
          that.recursiveDelete(options.data, id);

        } else {
          var data = that.getComponentJson($(item).data('tag'));
          data.index = options.count++;
          data.name = data.tag + '_' + data.index;
          gridElem.children[parentIndex].children.splice(evt.newIndex, 0, data);
        }

        options.state = data;
        that.renderComponent(options.data, $('#' + options.id));
      },
      onUpdate: function (evt) {
        var parentId = $(evt.item.parentElement.parentElement).attr('id'),
          parentIndex = evt.item.parentElement.dataset.index;
        if (typeof parentId == 'undefined') {
          parentId = $(evt.item).parents('.layui-tab').parent().attr('id');
        }
        var gridElem = that.recursiveFindElem(options.data, parentId);
        var children = gridElem.children[parentIndex].children;
        [children[evt.newIndex], children[evt.oldIndex]] = [children[evt.oldIndex], children[evt.newIndex]];
      },
      onEnd: function (evt) { }
    });

    this.config.itemIndex[itemId] = item;
  }

  // 查找原始元素
  Class.prototype.recursiveFindElem = function (array, name) {
    var that = this;
    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      if (element.name == name) {
        return element;
      }
      if (typeof element.children != 'undefined'
        && element.children.length) {
        var subElem = element.children;
        for (let i = 0; i < subElem.length; i++) {
          if (subElem[i].children.length) {
            var item = that.recursiveFindElem(subElem[i].children, name);
            if (item && typeof item != 'undefined') {
              return item;
            }
          }
        }
      }
    }
  }

  // 删除原始元素
  Class.prototype.recursiveDelete = function (array, name) {
    var that = this;
    for (let index = 0; index < array.length; index++) {
      const element = array[index];

      // 数据异常？？？
      if (element.name == name) {
        array.splice(index, 1);
        break;
      }

      if (typeof element.children != 'undefined'
        && element.children.length) {
        var subElem = element.children;
        for (let i = 0; i < subElem.length; i++) {
          if (subElem[i].children.length) {
            that.recursiveDelete(subElem[i].children, name);
          }
        }
      }
    }
  }

  // 生成随机数
  Class.prototype.Math = function () {
    return Math.round(Math.random() * 1000);
  }

  //记录所有实例
  thisTags.that = {};

  //获取当前实例对象
  thisTags.getThis = function (id) {
    var that = thisTags.that[id];
    if (!that) hint.error(id ? (MOD_NAME + ' instance with ID \'' + id + '\' not found') : 'ID argument required');
    return that
  };

  //重载实例
  MODULE_FORMDESIGN_NAME.reload = function (id, options) {
    var that = thisTags.that[id];
    that.reload(options);

    return thisTags.call(that);
  };

  //核心入口
  MODULE_FORMDESIGN_NAME.render = function (options) {
    var inst = new Class(options);
    return thisTags.call(inst);
  };

  layui.link(layui.cache.base + 'formDesign/formdesign.css');
  exports(MOD_NAME, MODULE_FORMDESIGN_NAME);
})