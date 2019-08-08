export default {
    name: 'u-chips',
    props: {
        placeholder: String,
        error: String,
        // 异步校验
        // [{ type: 'async', trigger: 'blur', message: '', validator(rule, value, callback){}]
        // 校验通过，执行callback();校验失败，执行callback(new Error())
        rules: Array,
        new_rules: Array,
        noSpace: Boolean,
        disabled: Boolean,
        placement: String,
        allowEmpty: {
            type: Boolean,
            default: true,
        },
        value: Array,
        modifyValue: String, // 保持出错记录需要传递该值
        modifyValueIndex: Number,
        type: String, // 云服务器名称搜索的type为 searchInput
    },
    data() {
        return {
            list: this.value,
            item: '',
            modifyItem: '',
            current: -1,
            max: 3,
            modifying: false,
            errMessage: '',
            focus: false,
            asyncChecking: false,
            hasMore: false, // type为searchInput 是否出现...标志
            isFocused: false, // 是否鼠标还聚焦在搜索框内
            morePosRight: 0,
        };
    },
    watch: {
        item(value) {
            // if (!value)
            //     return;
            this.validate(value);
        },
        modifyItem(value) {
            // if (!value)
            //     return;
            this.validate(value);
        },
        list(value, oldValue) {
            this.$emit('change', { value, oldValue });
        },
        value(value) {
            this.list = value;
        },
        modifying() {
            if (!this.modifying && !this.list.length && !this.allowEmpty)
                this.errMessage = this.error;
        },
    },
    computed: {
        // textarea每行的字数
        width() {
            const length = this.item.length;
            const width = length * 8.5 + 20;
            if (length <= 15)
                return 200;
            else
                return (width > 552 ? 552 : width);
        },
        height() {
            const row = Math.ceil(this.item.length / 66) || 1;
            return (row > 6 ? 6 : row) * 26;
        },
        maxHeight() {
            if (this.type === 'searchInput') {
                if (this.$refs.box && this.$refs.wrapper) {
                    this.$nextTick(() => {
                        if (this.$refs.wrapper.clientHeight > this.$refs.box.clientHeight) {
                            this.hasMore = true;
                            this.computeMorePositon();
                        } else
                            this.hasMore = false;
                    });
                }
                if (this.isFocused)
                    return 150;
                // 滚动到最顶上
                this.$refs.box && (this.$refs.box.scrollTop = -3);
                return 36;
            }
            // 输入框的最大高度
            const maxRows = (this.list.length / 4 > 6) ? 6 : (this.list.length / 4);
            return maxRows * 36;
        },
        syncRules() {
            const rules = this.rules || [];
            return rules.filter((r) => r.type !== 'async');
        },
        asyncRules() {
            const rules = this.rules || [];
            return rules.filter((r) => r.type === 'async');
        },
        async() {
            return this.asyncRules.length > 0;
        },
    },
    created() {
        window.addEventListener('keydown', this.onDocKeydown, false);
        if (this.type === 'searchInput')
            window.addEventListener('mousedown', this.onDocMousedown, false);
        // 是否需要保持错误信息
        if (this.modifyValue !== undefined) {
            this.modifyItem = this.modifyValue;
            this.current = +this.modifyValueIndex;
            this.modifying = true;
            this.onModifyBlur();
        }
        this.$emit('validMethod', this.submitValidate);
    },
    destroyed() {
        window.removeEventListener('keydown', this.onDocKeydown, false);
        if (this.type === 'searchInput')
            window.removeEventListener('mousedown', this.onDocMousedown, false);
    },
    methods: {
        /**
         * 进行验证的逻辑,validate是不关注当前事件是blur或input的
         * @param {string} value - 当前检测值
         * @param {string} [type='input'] - 事件种类
         * @return 错误信息，没有错误返回空字符
         */
        validate(value, type = 'input', list) {
            list = list || this.list;
            // 空值或已经有错误信息不检测
            if (!value && value !== '0' || this.errMessage) {
                this.emitValidate(value);
                return;
            }
            // 未通过检查的某项
            const errRule = this.syncRules.find((rule) => {
                // result为true表示通过了该条验证逻辑
                let result = false;
                if (!type.includes(rule.trigger))
                    return false;
                if (rule.type === 'method')
                    result = rule.options(value, rule, list);
                if (rule.type === 'is')
                    result = rule.options.test(value, list);
                if (rule.type === 'isNot')
                    result = !rule.options.test(value, list);

                return !result;
            });
            if (errRule || !this.async) { // 同步校验不通过，或者不存在异步校验规则，直接结束
                this.errMessage = errRule ? errRule.message : '';
                this.emitValidate(value);
            } else
                return this.asyncValidate(value, type, list);
        },
        asyncValidate(value, type) {
            let promise = Promise.resolve();
            this.asyncRules.filter((r) => type.includes(r.trigger)).forEach((rule) => {
                promise = promise.then(() => new Promise((res, rej) => {
                    rule.validator(rule, value, (error) => {
                        if (error === undefined) {
                            this.errMessage = '';
                            this.emitValidate(value);
                            res();
                        } else if (error instanceof Error) {
                            this.errMessage = rule.message;
                            this.emitValidate(value);
                            rej();
                        }
                    });
                }));
            });
            return promise;
        },
        onDocMousedown(event) {
            this.isFocused = this.$refs.box.contains(event.target);
            if (this.$refs.moreTag && this.$refs.moreTag.contains(event.target)) { // 点击更多，监听click事件不行
                setTimeout(() => this.onFieldClick(), 500);
            }
        },
        onDocKeydown(event) {
            let { current, list, modifying, modifyItem } = this;
            if (current < 0)
                return;
            // tab 键
            if (event.which === 9) {
                event.preventDefault();
                if (modifying)
                    this.generate(modifyItem, true);
                else if (current === (list.length - 1))
                    this.$refs.cpInput.focus();
                else
                    this.onFocus(current + 1);
            }

            // enter键
            // 这里没有进行current的判断，是因为函数一开始就判断了
            if (event.which === 13) {
                this.modifying = true;
                this.modifyItem = list[current];
                list.splice(current, 1);
                this.$nextTick(() => {
                    this.getCpModifyInput().focus();
                });
            }
            // 键盘右键
            if (event.which === 39) {
                // 生成项失焦，编辑输入框focus
                if (current === list.length - 1) {
                    current = -1;
                    this.$refs.cpInput.focus();
                    // 向右切换生成项的聚焦
                } else
                    this.onFocus(current + 1);
            }
            // 键盘左键
            if (event.which === 37) {
                // 左边界，不再往左移动生成项聚焦
                if (current === 0)
                    return;
                // 向左切换生成项的聚焦
                this.onFocus(current - 1);
            }
            // backspace(win) == deleteItem(mac)
            if (event.which === 8) {
                list.splice(current, 1);
                this.$emit('input', this.list);
                current = -1;
                this.$refs.cpInput.focus();
            }
        },
        /**
         * 编辑框失焦
         */
        onModifyBlur(event) {
            if (this.asyncChecking)
                return;
            this.generate(this.modifyItem, true);

            if (!this.errMessage && !this.async)
                this.$refs.cpInput.focus();
        },
        /**
         * 整个大的框聚焦
         */
        onFieldClick(event) {
            event && event.stopPropagation();
            if (this.modifying)
                this.getCpModifyInput().focus();
            else
                this.$refs.cpInput.focus();
        },
        /**
         * 创建输入框的focus事件回调
         * @param {object} event - 包装事件对象
         */
        onInputFocus(event) {
            this.current = -1;
            this.modifying = false;
            this.focus = true;
        },
        /**
         * 创建输入框的blur事件回调
         * @param {object} event - 包装事件对象
         */
        onInputBlur(event) {
            console.log('bluring');
            if (this.asyncChecking)
                return;
            this.generate(this.item);
            this.focus = false;

            // if (this.errMessage)
            //     this.$refs.cpInput && this.$refs.cpInput.focus();
        },
        /**
         * 编辑框的键盘事件
         * @param {object} event - 事件的包装对象
         */
        onKeydown(event) {
            event.stopPropagation();
            const { list, item } = this;

            this.errMessage = '';

            // enter键
            // 当只有一行的时候，静止默认enter键的默认操作
            if (event.which === 13 && this.height === 26 && this.type !== 'searchInput')
                event.preventDefault();

            // tab 键
            // 当input内容为空，恢复tab的默认操作
            if (event.which === 9 && item !== '') {
                event.preventDefault();
                this.generate(item);
                this.$refs.cpInput.focus();
            }
            // 空格键 生成项 回车键
            if ((event.which === 32 || event.which === 188 || (this.type === 'searchInput' && event.which === 13))) {
                // 生成项(满足相关要求)
                event.preventDefault();
                if (this.$refs.cpInput.$refs.input === document.activeElement && item) {
                    this.generate(item);
                    // 通过空格||逗号正常生成项之后，会残留字符。重置
                    /*if (!this.errMessage && !this.async) {
                        setTimeout(() => {
                            this.item = '';
                        });
                    }*/
                }
            }
            // 左键 || backspace 切换focus项
            // 当前输入框内无内容，则focus最新的生成项
            // item == false && item !== '0'，说明item为空字符串或空格组成的字符串
            if ((event.which === 37 || event.which === 8) && item === '' && item !== '0') {
                this.item = '';
                this.onFocus(list.length - 1);
            }
        },
        onAddInput() {
            // 处理用户复制粘贴多个以空格符分割开的字符串
            if (!this.item.endsWith(' ') && this.item.includes(' ')) {
                this.generate(this.item);
                this.$refs.cpInput.$refs.input.focus();
            }
        },
        /**
         * 修改输入框的键盘输入
         * @param {object} event - 包装事件对象
         */
        onModifyKeydown(event) {
            event.stopPropagation();
            const { current, modifyItem, modifying } = this;

            this.errMessage = '';

            // enter键
            // 禁止默认enter键的默认操作
            if (event.which === 13)
                event.preventDefault();

            // 空格键  生成项
            if (event.which === 32 || event.which === 188 || (this.type === 'searchInput' && event.which === 13)) { // searchInput 回车键添加项
                // 生成项(满足相关要求)
                if (this.getCpModifyInput() === document.activeElement && modifyItem) {
                    this.getCpModifyInput().blur();
                    if (!this.errMessage && !this.async)
                        this.$refs.cpInput.focus();
                }
            }

            // tab 键
            // 当input内容为空，恢复tab的默认操作
            if (event.which === 9 && modifyItem !== '') {
                event.preventDefault();
                this.generate(modifyItem, true);
                this.getCpModifyInput().blur();
            }

            // backspace(win) == deleteItem(mac)
            if (event.which === 8) {
                if (modifying && modifyItem === '') {
                    this.modifying = false;
                    this.current = current === 0 ? 0 : current - 1;
                }
            }
        },
        /**
         * 聚焦某个生成项
         * @param {number} index - 生成项的索引
         * @param {object} event - 包装的event对象
         */
        onFocus(index, $event) {
            if (this.asyncChecking)
                return;
            $event && $event.stopPropagation();
            this.modifying = false;
            this.$refs.cpInput.blur();
            this.current = index;
            // 这里是因为注册在document上的keydown事件，需要手动 $update
        },
        /**
         * 双击生成项，变为编辑状态
         * @param {number} index - 生成项的索引
         * @param {object} event - 包装的event对象
         */
        onDBLClick(index, event) {
            if (this.asyncChecking || this.errMessage)
                return;
            this.modifyItem = this.list[index];
            this.current = index;
            this.modifying = true;
            // 在list当中去除当前的编辑项
            this.list.splice(index, 1);
            this.$emit('input', this.list);
            this.$nextTick(() => {
                this.getCpModifyInput().focus();
            });
        },
        /**
         * 生成项（包括一次生成多个项）
         * @param {string} item - 生成项的内容
         * @param {boolean} [isModify=false] - 是否是编辑已生成项
         */
        generate(item, isModify = false) {
            console.log('generating');
            if (this.type === 'searchInput' && /^\s*$/.test(item))
                return;
            // item == false，说明item为空字符串或空格组成的字符串
            if (item === '' && item !== '0') {
                if (isModify)
                    this.modifyItem = '';
                else
                    this.item = '';
                this.emptyValidate();

                return;
            }

            const hasSpace = !this.noSpace && item.indexOf(' ') !== -1;
            const hasComma = ~item.indexOf(',');
            // 单次生成多个项的数组
            // arrIndex是数组中出错的项的索引
            // str为生成项之外的错误部分的字符
            let itemArr = [];
            let arrIndex = 0;
            if (hasSpace && hasComma)
                item = item.replace(/,/g, ' ');
            if (!hasSpace && !hasComma)
                itemArr = [item];
            else
                itemArr = item.split(hasSpace ? ' ' : ',').filter((item) => item);

            if (this.async)
                return this.asyncGenerate(item, isModify, itemArr);

            this.validateQueue(itemArr, this.$refs).then(res => {
                this.list= this.list.concat(itemArr);
                this.item = '';
                this.$refs.cpInput.currentValue = this.item;
            }).catch(e => {
                this.list = this.list.concat(itemArr.splice(0, e));
                const str = itemArr.join(' ');
                isModify ? (this.modifyItem = str) : (this.item = str);
                this.$refs.cpInput.currentValue = this.item;
            });
            /*let validatePromise = new Promise((resolve, reject) => {
                itemArr.forEach((item, index) => {
                    this.$refs.textValidator.value = item;
                    this.$refs.textValidator.validate('input').then(res => {
                        console.log(index,res);
                        arrIndex = index + 1;
                        if (index === itemArr.length - 1) {
                            resolve(arrIndex);
                        }
                    }, e => {
                        reject(index);
                    })
                });
            });*/

            //this.$refs.cpInput.currentValue = '';
            /*const validateArr = itemArr.map((item) => {
                return this.$refs.textValidator.validate('input').then(res => {
                    console.log(res);
                    this.list.push(item);
                    itemArr.shift();
                    this.$refs.textValidator.value = itemArr.join(' ');
                })
            });
            this.promiseQueue(validateArr).catch(e => {
                console.log(e);
            });*/
            /*itemArr.every((itm, index) => {
                this.validate(itm, 'input+blur');
                this.$refs.textValidator.validate('input + blur').then(res => {
                    console.log(res);
                    this.list.push(itm);
                    this.$emit('input', this.list);
                    arrIndex = index + 1;
                    return true;
                }).catch(e => {
                    console.log(e);
                    return false;
                });*/
                /*if (this.errMessage)
                    return false;
                else {
                    // 编辑生成项
                    if (isModify) {
                        // 只有正确输入的情况下，才需要先删除之前的项
                        this.list.splice(this.current, 0, itm);
                    // 创建新生成项
                    } else
                        this.list.push(itm);
                    this.$emit('input', this.list);
                    arrIndex = index + 1;
                    return true;
                }*/
            //});
        },
        asyncGenerate(item, isModify, itemArr) {
            let promise = Promise.resolve();
            let arrIndex = 0;
            this.asyncChecking = true;
            itemArr.forEach((itm, index) => {
                promise = promise.then(() => this.validate(itm, 'input+blur')
                    .then(() => {
                        if (this.errMessage)
                            throw new Error();
                        else {
                            if (isModify) {
                                this.list.splice(this.current, 0, itm);
                            } else
                                this.list.push(itm);
                            this.$emit('input', this.list);
                            arrIndex = index + 1;
                        }
                    }));
            });
            return promise.catch((err) => err)
                .then(() => {
                    itemArr.splice(0, arrIndex);
                    const str = itemArr.join(' ');
                    if (!str)
                        this.modifying = false;
                    this.asyncChecking = false;
                    this.$nextTick(() => {
                        isModify ? (this.modifyItem = str) : (this.item = str);
                        this.$refs.cpInput.focus();
                    });
                });
        },
        /**
         * 删除某项
         * @param {number} index - 某项的索引
         */
        deleteItem(index) {
            if (this.asyncChecking)
                return;
            this.list.splice(index, 1);
            this.$emit('input', this.list);
            const item = this.modifying ? this.modifyItem : this.item;
            this.validate(item, 'input+blur');
            this.emptyValidate();
        },
        /**
         * 外部调用看数据是否合法
         */
        $checkValidity() {
            // 没有已创建项的更改
            // 没有错误信息
            // 创建输入框没有内容
            // 有正确输入项
            return !this.modifying && !this.errMessage && !this.item && this.list.length;
        },
        /**
         * 提交校验时使用
         * 显示空态提示。
         */
        submitValidate() {
            if (!this.allowEmpty && !this.list.length && !this.item && !this.modifyItem) {
                this.errMessage = this.error;
                return false;
            } else
                return this.$checkValidity();
        },
        getCpModifyInput() {
            return this.$refs.cpModifyInput && (Array.isArray(this.$refs.cpModifyInput) ? this.$refs.cpModifyInput[0] : this.$refs.cpModifyInput);
        },
        emitValidate(value) {
            this.$emit('validate', {
                isValid: !!this.errMessage,
                errMessage: this.errMessage,
                value,
                current: this.current === -1 ? this.list.length : this.current,
            });
        },
        emptyValidate(value = '') {
            if (!this.allowEmpty && !this.list.length) {
                this.errMessage = this.error;
                this.emitValidate(value);
            }
        },
        deleteAll() {
            this.list = [];
            this.hasMore = false;
            this.$emit('input', this.list);
        },
        computeMorePositon() { // 计算更多的位置
            this.$nextTick(() => {
                // 最后一个第一行的元素
                const index = Array.prototype.findIndex.call(this.$refs.wrapper.children, ((item) => (item.offsetTop > 10 && item.localName !== 'textarea')));
                if (index === -1) {
                    this.hasMore = false;
                    return;
                }
                const lastEle = this.$refs.wrapper.children[index - 1];
                this.hasMore = true;
                this.morePosRight = this.$refs.wrapper.clientWidth - lastEle.offsetLeft - lastEle.offsetWidth + 52;
            });
        },
        async validateQueue(itemArr, $refs) {
            for (let i = 0 ;i < itemArr.length; i++) {
                try {
                    this.$refs.textValidator.value = itemArr[i];
                    await $refs.textValidator.validate('blur').then(res => {
                    })
                } catch (e) {
                    throw (i);
                }
            }
            return 'success!';
        }
    },
};
