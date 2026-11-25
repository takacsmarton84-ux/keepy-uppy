import {defineArrayMember, defineField, defineType} from 'sanity'

// An Instagram-style story: a round cover in the row at the top of the News
// screen, and one or more full-screen image slides that play one after another.
export const story = defineType({
  name: 'story',
  title: 'Story',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      description: 'Shown under the circle. Keep it short.',
      type: 'string',
      validation: (rule) => rule.required().max(18),
    }),
    defineField({
      name: 'cover',
      title: 'Circle image',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slides',
      title: 'Slides',
      description: 'Each slide shows for 5 seconds. Upright (9:16) photos work best; set the hotspot so the important part stays in view.',
      type: 'array',
      validation: (rule) => rule.required().min(1).max(15),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'slide',
          title: 'Slide',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {hotspot: true},
              validation: (rule) => rule.required(),
            }),
            defineField({name: 'caption', title: 'Caption', type: 'string', validation: (rule) => rule.max(120)}),
            defineField({
              name: 'news',
              title: 'Link to a news item',
              description: 'Adds a button that opens this news item.',
              type: 'reference',
              to: [{type: 'news'}],
            }),
            defineField({
              name: 'url',
              title: 'Or an external link',
              type: 'url',
              validation: (rule) => rule.uri({scheme: ['http', 'https', 'mailto']}),
            }),
            defineField({
              name: 'label',
              title: 'Button text',
              description: 'Defaults to "Read more".',
              type: 'string',
              validation: (rule) => rule.max(30),
            }),
          ],
          preview: {
            select: {title: 'caption', media: 'image'},
            prepare: ({title, media}) => ({title: title || 'Slide', media}),
          },
        }),
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Show from',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'expiresAt',
      title: 'Show until',
      description: 'Leave empty to keep the story until you delete it. For an Instagram-style story, set it 24 hours after "Show from".',
      type: 'datetime',
      validation: (rule) =>
        rule.custom((value, ctx) => {
          const from = (ctx.document as {publishedAt?: string} | undefined)?.publishedAt
          return !value || !from || value > from ? true : '"Show until" must be after "Show from"'
        }),
    }),
  ],
  orderings: [
    {title: 'Newest first', name: 'publishedDesc', by: [{field: 'publishedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', media: 'cover', from: 'publishedAt', until: 'expiresAt', slides: 'slides'},
    prepare: ({title, media, until, slides}) => ({
      title,
      subtitle:
        `${(slides || []).length} slide(s)` +
        (until ? ` · until ${new Date(until).toLocaleString('en-GB', {dateStyle: 'short', timeStyle: 'short'})}` : ''),
      media,
    }),
  },
})
