// DebuggerRender.js
// 工具函数：浅比较 props
function diffProps(prev = {}, next = {}) {
  const changes = {};
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  allKeys.forEach((key) => {
    if (prev[key] !== next[key]) {
      changes[key] = { before: prev[key], after: next[key] };
    }
  });
  return changes;
}

// 序列化 vnode，用于比较
function serializeVNodes(vnodes = []) {
  return vnodes.map((vnode) => {
    return {
      tag: vnode.tag,
      key: vnode.key,
      text: vnode.text,
      children: vnode.children ? vnode.children.length : 0,
    };
  });
}

function diffSlots(prev = [], next = []) {
  const changes = [];
  const maxLen = Math.max(prev.length, next.length);
  for (let i = 0; i < maxLen; i++) {
    if (JSON.stringify(prev[i]) !== JSON.stringify(next[i])) {
      changes.push({ index: i, before: prev[i], after: next[i] });
    }
  }
  return changes;
}

export default {
  name: 'DebuggerRender',

  props: {
    is: {
      type: [String, Object],
      required: true,
    },
  },

  data() {
    return {
      prevProps: {},
      prevSlots: [],
    };
  },

  render(h) {
    // ---- Props Diff ----
    const changes = diffProps(this.prevProps, this.$props);
    if (Object.keys(changes).length > 0) {
      console.group(`[DebuggerRender] <${this.is}> props changed`);
      console.table(changes);
      console.groupEnd();
    }

    // ---- Slots Diff ----
    const currentSlots = serializeVNodes(this.$slots.default || []);
    const slotChanges = diffSlots(this.prevSlots, currentSlots);
    if (slotChanges.length > 0) {
      console.group(`[DebuggerRender] <${this.is}> slots changed`);
      console.table(slotChanges);
      console.groupEnd();
    }

    // 更新快照
    this.prevProps = { ...this.$props };
    this.prevSlots = currentSlots;

    // ---- 透传 vnode data ----
    const data = {
      ...(this.$vnode ? this.$vnode.data : {}),
      props: this.$props,
      on: this.$listeners,
      scopedSlots: this.$scopedSlots,
    };

    // ---- 渲染 ----
    return h(
      'div',
      {
        class: 'debugger-wrapper',
        style: { border: '1px dashed red', padding: '4px' },
      },
      [h(this.is, data, this.$slots.default)]
    );
  },
};
