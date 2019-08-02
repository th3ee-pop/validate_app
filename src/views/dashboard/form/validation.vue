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
                        <u-input size="huge normal" placeholder="1-65535内的整数"></u-input>
                    </u-validator>
                    <u-validator label="服务端口" rules="required | range(1,65535) @i" muted="message">
                        <u-input size="huge normal" placeholder="1-65535内的整数"></u-input>
                    </u-validator>
                    <u-validator>
                        <u-chips v-model="chipList" :new_rules="chipRules">
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
                { type: 'string', trigger: 'blur', message: '长度为6', validator: (rule, value ,callback) => {
                    if (value.length === 6) {
                        callback(new Error());
                    } else {
                        callback();
                    }
                } }
            ],
            chipList: []
        };
    },
    mounted() {
        // 必须初始化时或在获取数据到时安静验证一次
        this.$refs.form.validate(true)
            .catch(() => { /* */ });
        // 在获取数据到时如下
        // this.getData().then(...)
        //  .then(() => this.$refs.form.validate(true))
        //  .catch(() => {});
    },
    methods: {
        testinput() {
          console.log(this.test);
        },
        add() {
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
