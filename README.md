Encyclopaedia Fennica - source
==============================

This is the source code that powers the [Encyclopaedia Fennica](https://fennica.pohjoiseen.fi/) website.

**This is only the source, all the actual content (and images) is contained in a submodule.  The content submodule
is self-hosted, as it is way too big for GitHub.  You can however clone it, there is read-only HTTP access to the
repository.  The license for content part is CC BY-NC-SA 3.0.**

This project is released under MIT license in hopes it could be useful for someone, but no attempt was made to decouple
it from specifics of the Encyclopaedia Fennica website.  The content is moved out into a separate submodule, but
stylesheets and everything else are hardcoded.  On the positive side, modifications should not be very difficult.
This is a quick and dirty project and the code is obviously not particularly clean, there are no tests, etc.

This is not a web application as such but a custom-written static site generator, with a development server mode.
It is written in TypeScript for NodeJS environment.

The generator builds website content from `content` dir into a snapshot in `build` dir which can then be served
completely statically.  The generator processes following files:

* **Static files** are simply copied from content `static` dir to build `static` dir.  They aren't used much
  (for client-side JS and CSS we use webpack), just for favicon and such
* **Images** are any .jpg, .jpeg, .png files outside `static` dir.  They are copied into build dir, preserving
  directory structure, and `1x`, `2x` and `thumb` versions are generated for each (if the image is big enough)
* **Content files** are Markdown files with front matter.  They can be arranged in the content dir in whatever
  directory structure is convenient; that structure is discarded, and all content files of a given type live in one
  namespace and must have unique names.  They must have names of the form `name.lang.type.md`, where `lang` is 
  a two-letter language code.

The following content types are supported:

* **Articles** (`name.XX.article.md`) are the simplest kind, just static pages (although they may be manually interlinked
  with `prev`/`next` links, forming some sort of throughout order).  They are transformed into `/XX/article/name/` pages.
* **Posts** (`YYYY-MM-DD-name.XX.post.md`) must include their date in a filename.  They are transformed into
  `/XX/YYYY/MM/DD/name/` pages, automatically interlinked with next and previous posts.  They are also arranged into
  blogs, which are chronological lists of posts split into pages.  If a post content includes `<!--more-->` commentary,
  then on the blog page the content is displayed only up to this marker, and a "read more" link is added.
  Blog pages are generated with URLs `/XX/`, `/XX/2/` etc. (paginated).  Only one blog per language is thus
  currently supported, without categories or tags.  RSS feeds are also generated for blogs under `/XX/rss.xml`.
* **Places (POIs)** (`name.XX.poi.md`) are placed on a map.  They must have at least coordinates and icon type set,
  and can be arranged hierarchically into trees using parent property.
  They are displayed on more fanciful pages than articles and posts, under `/XX/place/name/` URLs.  Those include
  an optional image gallery on top, optional properties to show in the sidebar, and a mini-map in the sidebar.
  The minimap shows, apart from the POI itself, all POIs that are its descendants.  POIs are clickable and will display
  a popup with a link.  A catalogue of all POIs is automatically generated under `/XX/place/` URL.
* **Maps** (`name.XX.map.md`) display a full-size map with a translucent side bar.  The map may show certain kinds
  of POIs with their descendants.  By default the sidebar shows the content of `name.XX.map.md` file.  Clicking on a POI
  will show some information about it in the sidebar, along with a link to a full POI page.  This POI information
  is loaded dynamically from pregenerated `/XX/place/name.json` files.  The maps themselves are shown under
  `/XX/map/name/` URL.  Maps use hash navigation so a particular position on the map can be linked to.

There is no home page as such and a server redirect from `/` must be defined manually.

As you see the content supported is multilingual.  All language versions are in principle orthogonal, and do not need
to have any content duplicated; but content items with sames names will have links to alternate language versions in
the page header.

The complete set of front matter properties for every type can be seen in `src/contentTypes.ts`.

The textual part of the content of all types, along with certain front matter properties, undergoes following
transformations:

* Markdown is compiled into HTML, of course
* Auto-typography is applied (double dash to mdash, putting in nbsp's, etc.)
* Links (only standard &lt;a href&gt;) to other content item files are transformed into correct public URLs
* Relative references to images (only standard &lt;img src&gt;) get src and srcset updated with proper Retina-enabled
  downsized versions, wrapped into a link to a full-size version, and into a figure tag with optional figcaption that
  gets the image alt text.  This can be opted out by explicitly putting in an img tag with `nofigure` or `raw`
  attributes
* Collections of images in between `<!--gallery-->` and `<!--/gallery-->` comments are output as a `react-image-gallery`
  component.  The gallery is not otherwise configurable and all non-image content between these markers will be
  discarded.  Note that this kind of gallery can be put into any content
  type in any place, while POIs additionally may have a "primary" gallery which is configured through front matter
  and is displayed separately from POI textual content (e. g. in the side pane of a map view)

All pages are rendered using React as a plain templating engine, into completely static markup.  They are not hydrated
on client, and no client-side routing is used.  Nonetheless there are a few React components
(`MapView`, `MiniMapView`, `ReactImageGallery`) that can also run on the client side.  Those we display using
`ssrComponent()` function which just renders a stub div with component type and base64-encoded props.  Then during the
server-side rendering "second pass" they are rendered properly into hydratable markup.  The client side code (which
uses a rather plain webpack configuration for JS/CSS build) is thus very simple and doesn't need to know much about
the pages; it just looks for SSR stub divs, and hydrates components prerendered in them, using component type and props
from the stub div.  Hope that makes sense!

`yarn dev` runs a simple development server on port 8001 by default; this server most of the time does not need to be
restarted (which involves full re-scan and re-parse of all content), and can handle showing added and updated pages
on the fly.  This is a very crude implementation and with some updates and especially deletions of content not
everything might be re-rendered properly, and also there are obvious optimizations possible (store pre-parsed content
between server runs) but so far they aren't needed yet. `yarn build` in turn builds up complete static website tree into `build`,
guaranteed to be in sync with what you have in the content dir.

Alexander
