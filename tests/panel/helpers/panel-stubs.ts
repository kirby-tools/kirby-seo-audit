import { defineComponent, h } from "vue";

const passThrough = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h("div", slots.default?.()),
});

/** Stand-ins for the Panel components, enough to read what the plugin passes them. */
export const panelStubs = {
  "k-box": passThrough,
  "k-button-group": passThrough,
  "k-text": passThrough,
  "k-button": defineComponent({
    props: { text: String, disabled: Boolean, badge: Object },
    emits: ["click"],
    setup:
      (props, { emit }) =>
      () =>
        h(
          "button",
          {
            disabled: props.disabled,
            "data-badge": props.badge && JSON.stringify(props.badge),
            onClick: () => emit("click"),
          },
          props.text,
        ),
  }),
  "k-field": defineComponent({
    props: { label: String },
    setup:
      (props, { slots }) =>
      () =>
        h("section", [
          h("header", [props.label, slots.options?.()]),
          slots.default?.(),
        ]),
  }),
};
