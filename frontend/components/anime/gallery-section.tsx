"use client"

import { useState } from "react"
import { ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"

interface GallerySectionProps {
  images: {
    src: string
    alt: string
  }[]
}

export function GallerySection({ images }: GallerySectionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const { t } = useLanguage()

  const handlePrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1)
    }
  }

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1)
    }
  }

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-6">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{t.common.gallery}</h2>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className="relative aspect-video rounded-xl overflow-hidden border border-border group cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/40 rounded-xl transition-colors duration-300" />
            </button>
          ))}
        </div>

        {/* Lightbox Modal */}
        {selectedIndex !== null && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-background-secondary/90 border border-border text-foreground hover:bg-background-tertiary hover:border-primary/25 transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Arrows */}
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevious() }}
              className="absolute left-4 p-3 rounded-full bg-background-secondary/90 border border-border text-foreground hover:bg-background-tertiary hover:border-primary/25 transition-all duration-300"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleNext() }}
              className="absolute right-4 p-3 rounded-full bg-background-secondary/90 border border-border text-foreground hover:bg-background-tertiary hover:border-primary/25 transition-all duration-300"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image */}
            <div 
              className="relative max-w-4xl max-h-[80vh] w-full aspect-video rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[selectedIndex].src}
                alt={images[selectedIndex].alt}
                fill
                className="object-contain"
              />
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background-secondary/90 px-4 py-2 rounded-full border border-border">
              <span className="text-primary font-semibold">{selectedIndex + 1}</span>
              <span className="text-foreground-subtle"> / {images.length}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
