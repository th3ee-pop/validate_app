<script>
    import {UTextarea} from 'proto-ui.vusion';
    export default {
       name: 'u-textarea-dash',
       extends: UTextarea
    }
</script>

<style module>
    @import "proto-ui.vusion/src/components/u-textarea.vue/module.css";
    .root {
        width: 420px;
        height: 120px;
        min-width: $width-base;
        min-height: $height-base;
        padding: 4px 8px;
        line-height: inherit;
        border-radius: 12px;
        box-sizing: border-box;
    }
    .root .input {
        margin: 3px 0
    }
 /*   .baseline {
        display: none;
    }*/

</style>
