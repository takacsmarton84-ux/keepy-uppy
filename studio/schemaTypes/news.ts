import {defineField, defineType} from 'sanity'

// One news item shown in the game's News panel.
// The game reads published items, newest first (by publishedAt).
export const news = defineType({
  name: 'news',
  title: 'News',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(90),
    }),
    defineField({
      name: 'slug',
      title: 'Link name',
      description: 'Used in links to this item, for example from a push notification (…/keepy-uppy/?news=link-name).',
      type: 'slug',
      options: {source: 'title', maxLength: 60},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Publish date',
      description: 'Items with a future date stay hidden until then.',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Short intro',
      description: 'One or two sentences, shown in the news list.',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({name: 'alt', title: 'Image description', type: 'string'}),
      ],
    }),
    defineField({name: 'body', title: 'Text', type: 'body'}),
  ],
  orderings: [
    {title: 'Newest first', name: 'publishedDesc', by: [{field: 'publishedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', date: 'publishedAt', media: 'image'},
    prepare: ({title, date, media}) => ({
      title,
      subtitle: date ? new Date(date).toLocaleDateString('en-GB') : 'No date',
      media,
    }),
  },
})
