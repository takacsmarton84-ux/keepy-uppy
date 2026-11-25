import type {ReactNode} from 'react'
import {defineArrayMember, defineField, defineType, type BlockAnnotationProps} from 'sanity'
import {ColorWheelIcon} from '@sanity/icons/ColorWheel'
import {HighlightIcon} from '@sanity/icons/Highlight'
import {LaunchIcon} from '@sanity/icons/Launch'
import {LinkIcon} from '@sanity/icons/Link'
import {PlayIcon} from '@sanity/icons/Play'

// Brand colours the editor may pick for text. The game uses the same list,
// so change both places together (index.html → NEWS_COLORS).
export const TEXT_COLORS = [
  {title: 'Teal', value: 'teal', hex: '#3cc3c4'},
  {title: 'Gold', value: 'gold', hex: '#ac9372'},
  {title: 'Red', value: 'red', hex: '#e5484d'},
]

// Pulls the video id out of the usual YouTube link shapes.
export function youtubeId(url?: string): string | null {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/)
  return m ? m[1] : null
}

/* Editor previews: these only change how the text looks inside the Studio. */
const Lead = (p: {children?: ReactNode}) => <span style={{fontSize: '1.2em', lineHeight: 1.45}}>{p.children}</span>
const Small = (p: {children?: ReactNode}) => <span style={{fontSize: '0.82em', opacity: 0.75}}>{p.children}</span>
const Mark = (p: {children?: ReactNode}) => <mark style={{background: '#fff3a3'}}>{p.children}</mark>
const Colored = (p: BlockAnnotationProps) => {
  const color = (p.value as {color?: string} | undefined)?.color
  const c = TEXT_COLORS.find((x) => x.value === color)
  return <span style={{color: c ? c.hex : undefined}}>{p.renderDefault(p)}</span>
}

const youtube = defineType({
  name: 'youtube',
  title: 'YouTube video',
  type: 'object',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'url',
      title: 'YouTube link',
      description: 'Paste the link from YouTube, for example https://www.youtube.com/watch?v=…',
      type: 'url',
      validation: (rule) =>
        rule.required().custom((url) => (!url || youtubeId(url) ? true : 'This is not a YouTube video link')),
    }),
    defineField({name: 'caption', title: 'Caption', type: 'string'}),
  ],
  preview: {
    select: {url: 'url', caption: 'caption'},
    prepare: ({url, caption}) => {
      const id = youtubeId(url)
      return {
        title: caption || 'YouTube video',
        subtitle: url,
        media: id ? <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" style={{objectFit: 'cover'}} /> : PlayIcon,
      }
    },
  },
})

const button = defineType({
  name: 'ctaButton',
  title: 'Button',
  type: 'object',
  icon: LaunchIcon,
  fields: [
    defineField({name: 'label', title: 'Button text', type: 'string', validation: (rule) => rule.required().max(40)}),
    defineField({
      name: 'url',
      title: 'Link',
      description: 'Leave empty to make the button close the news and start the game.',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['http', 'https', 'mailto']}),
    }),
  ],
  preview: {
    select: {label: 'label', url: 'url'},
    prepare: ({label, url}) => ({title: label || 'Button', subtitle: url || 'Starts the game'}),
  },
})

const inlineImage = defineArrayMember({
  type: 'image',
  title: 'Image',
  options: {hotspot: true},
  fields: [
    defineField({name: 'caption', title: 'Caption', type: 'string'}),
    defineField({name: 'alt', title: 'Image description', type: 'string'}),
  ],
})

export const body = defineType({
  name: 'body',
  title: 'Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Lead (larger intro text)', value: 'lead', component: Lead},
        {title: 'Small', value: 'small', component: Small},
        {title: 'Heading 2', value: 'h2'},
        {title: 'Heading 3', value: 'h3'},
        {title: 'Heading 4', value: 'h4'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
          {title: 'Underline', value: 'underline'},
          {title: 'Strike', value: 'strike-through'},
          {title: 'Highlight', value: 'highlight', icon: HighlightIcon, component: Mark},
        ],
        annotations: [
          defineArrayMember({
            name: 'link',
            title: 'Link',
            type: 'object',
            icon: LinkIcon,
            fields: [
              defineField({
                name: 'href',
                title: 'URL',
                type: 'url',
                validation: (rule) => rule.required().uri({scheme: ['http', 'https', 'mailto']}),
              }),
            ],
          }),
          defineArrayMember({
            name: 'textColor',
            title: 'Text colour',
            type: 'object',
            icon: ColorWheelIcon,
            components: {annotation: Colored},
            fields: [
              defineField({
                name: 'color',
                title: 'Colour',
                type: 'string',
                options: {list: TEXT_COLORS.map(({title, value}) => ({title, value})), layout: 'radio'},
                validation: (rule) => rule.required(),
              }),
            ],
          }),
        ],
      },
    }),
    inlineImage,
    defineArrayMember({type: 'youtube'}),
    defineArrayMember({type: 'ctaButton'}),
  ],
})

export const bodyTypes = [youtube, button, body]
