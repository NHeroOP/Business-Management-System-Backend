import slugify from "slugify";

export const generateSlug = (
  text: string,
  suffix?: string,
) => {
  const baseSlug = slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });

  if (!suffix) {
    return baseSlug;
  }

  return `${baseSlug}-${suffix}`;
};