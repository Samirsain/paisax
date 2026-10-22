import { createCn } from "cn/config"

/** Class merging that knows the Stitch type scale, so `text-label-lg` reads as a size, not a colour. */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["label-sm", "label-md", "label-lg", "body-sm", "body-md", "body-lg", "headline-sm", "headline-md", "headline-lg", "stat", "display"] }],
    },
  },
})

/** The one container surface: a white card on the lavender ground. */
export const card = "rounded-xl bg-card shadow-card"
