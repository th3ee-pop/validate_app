<template>
    <div>
        <u-linear-layout>
            <h3>表单：</h3>
            <u-form ref="form" gap="large" :rules="rules" @validate="canSubmit = $event.valid">
                <u-form-item label="用户名" name="username">
                    <u-input size="huge" v-model="model.username" maxlength="12" placeholder="4~12个字符"></u-input>
                </u-form-item>
                <u-form-item label="邮箱" name="email">
                    <u-input size="huge" v-model="model.email" maxlength="24" placeholder="请输入邮箱"></u-input>
                </u-form-item>
                <u-form-item label="手机号码" name="phone">
                    <u-input size="huge" v-model="model.phone" maxlength="11" placeholder="请输入手机号码"></u-input>
                </u-form-item>
                <u-form-item>
                    <u-button color="primary" :disabled="!canSubmit" @click="submit()">提交</u-button>
                </u-form-item>
            </u-form>
        </u-linear-layout>
        <u-linear-layout style="margin-top: 100px">
            <h3>嵌套验证：</h3>
            <u-validator>
                <u-linear-layout gap="small">
                    <u-validator label="容器端口" rules="required | range(1,65535) @i" muted="message">
                        <u-input size="huge normal" placeholder="1-65535内的整数" v-model="container"></u-input>
                    </u-validator>
                    <u-validator label="服务端口" rules="required | range(1,65535) @i" muted="message">
                        <u-input size="huge normal" placeholder="1-65535内的整数"></u-input>
                    </u-validator>
                    <u-validator>
                        <u-chips placeholder="请输入" v-model="chipList" :new_rules="chipRules"  :allowEmpty="false" error="不能为空啊！！！">
                        </u-chips>
                    </u-validator>
                </u-linear-layout>
            </u-validator>
        </u-linear-layout>
        <u-linear-layout>
            <u-input v-model="test" @input="testinput" ref="test_input"></u-input>
            <u-button @click="add">check</u-button>
        </u-linear-layout>
    </div>

</template>

<script>
export default {
    data() {
        return {
            test: '',
            canSubmit: false,
            model: {
                username: '',
                email: '',
                phone: '',
            },
            container: 10,
            rules: {
                username: [
                    { type: 'string', required: true, trigger: 'input+blur', message: '请输入用户名' },
                    { type: 'string', min: 4, max: 12, trigger: 'input+blur', message: '请输入4~12个字符' },
                ],
                email: [
                    { type: 'string', required: true, trigger: 'input+blur', message: '请输入邮箱' },
                    { type: 'email', trigger: 'input+blur', message: '邮箱格式不正确' },
                ],
                phone: [
                    { type: 'string', pattern: /^\d{11}$/, trigger: 'input+blur', message: '手机号码格式不正确' },
                ],
            },
            chipRules: [
                /*{ type: 'async', trigger: 'blur', message: '包含a', validator: (rule, value, callback) => {
                    console.log(value);
                   let asyncPromise = new Promise((resolve, reject) => {
                       setTimeout(() => {
                           if(value.indexOf('a') > -1) {
                               reject('found!');
                           } else {
                               resolve('pass!');
                           }
                       }, 1500);
                   });
                    asyncPromise.then(res => callback()).catch(e => callback(new Error()))
                } },*/
                { type: 'string', min: 4, max: 12, trigger: 'blur', message: '请输入4~12个字符' },
                { type: 'string', trigger: 'input', message: '包含a', validator: (rule, value, callback) => {
                    if (value.indexOf('a') > -1) {
                        callback(new Error());
                    } else {
                        callback();
                    }
                }},
                { type: 'method', trigger: 'blur',message:'最多10个', options: (value, rule, list) => {
                    return !(this.chipList.length >= 10);
                }},
                { type: 'method', trigger: 'blur',message:'有重复值', options: (value, rule, list) => {
                    return !(this.chipList.includes(value));
                }},
            ],
            chipList: ['202', '222a', '222a']
        };
    },
    mounted() {
        // 必须初始化时或在获取数据到时安静验证一次
        this.$refs.form.validate(true)
            .catch(() => { /* */ });
        setTimeout(()=> {
            this.container = 15;
        }, 2000)
        // 在获取数据到时如下
        // this.getData().then(...)
        //  .then(() => this.$refs.form.validate(true))
        //  .catch(() => {});
    },
    methods: {
        testinput() {
          //console.log(this.chipList);
        },
        add() {
            console.log(this.chipList);
          this.test++;
        },
        submit() {
            this.$refs.form.validate()
                .then(() => alert('提交成功'))
                .catch(() => { /* */ });
        },
    },
};
</script>
