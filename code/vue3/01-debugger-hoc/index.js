import { h, reactive, watch, toRaw, isVNode } from 'vue';

/**
 * 通用 HOC 封装
 * @param {Component} WrappedComponent 被包裹的组件
 * @param {Object} options 配置选项
 *  - debug: 是否打印 diff，默认 true
 *  - defaultSlot: 默认 slot 内容，可选
 */
export function withHoc(WrappedComponent, options = {}) {
  const { debug = true, defaultSlot = null } = options;

  return (props, { slots, emit }) => {
    // 响应式记录上一次 props/slots，用于 diff 打印
    const prevProps = reactive({ ...props });
    const prevSlots = reactive({ ...slots });

    // 打印 props diff
    if (debug) {
      watch(
        () => props,
        (newProps) => {
          const diffs = {};
          Object.keys(newProps).forEach((key) => {
            if (prevProps[key] !== newProps[key]) {
              diffs[key] = { old: prevProps[key], new: newProps[key] };
              prevProps[key] = newProps[key];
            }
          });
          if (Object.keys(diffs).length > 0) {
            console.log('[HOC] Props changed:', diffs);
          }
        },
        { deep: true, immediate: true }
      );

      // 打印 slots diff
      watch(
        () => slots,
        (newSlots) => {
          const slotNames = Object.keys(newSlots);
          slotNames.forEach((name) => {
            if (prevSlots[name] !== newSlots[name]) {
              console.log(`[HOC] Slot "${name}" changed`);
              prevSlots[name] = newSlots[name];
            }
          });
        },
        { deep: true, immediate: true }
      );
    }

    // 支持 v-model 双向绑定透传
    const modelProps = {};
    Object.keys(props).forEach((key) => {
      // v-model 默认绑定 'modelValue'，可以扩展为自定义
      if (key === 'modelValue') {
        modelProps['value'] = props[key];
        modelProps['onUpdate:modelValue'] = (val) =>
          emit('update:modelValue', val);
      }
    });

    // 合并 slots，支持默认 slot
    const mergedSlots = { ...slots };
    if (defaultSlot && !slots.default) {
      mergedSlots.default = () =>
        isVNode(defaultSlot) ? defaultSlot : h('div', {}, defaultSlot);
    }

    // 渲染被包裹组件
    return h(
      WrappedComponent,
      {
        ...props,
        ...modelProps,
        // 事件透传
        on: emit,
      },
      mergedSlots
    );
  };
}
