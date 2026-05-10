# ChordPro Makefile

# ChordPro configuration file
CONFIG := .chordpro.json

# Default target: Generate individual PDFs and a combined songbook
all: pdfs songbook.pdf

# Target to generate individual PDFs for each song
# Uses a shell loop to safely handle spaces in filenames
pdfs:
	@find . -maxdepth 2 -name "*.cho" -not -name "default.cho" -exec sh -c ' \
		for f; do \
			echo "Generating PDF for $$f..."; \
			chordpro --config=$(CONFIG) --output="$${f%.cho}.pdf" "$$f"; \
		done' sh {} +

# Target to generate a single combined songbook PDF
# Uses --filelist to safely handle spaces in filenames
songbook.pdf:
	@echo "Generating combined songbook.pdf..."
	@find . -maxdepth 2 -name "*.cho" -not -name "default.cho" | sort > .filelist.txt
	@chordpro --config=$(CONFIG) --filelist=.filelist.txt --output=$@
	@rm .filelist.txt

# Remove all generated PDF files
clean:
	@echo "Cleaning up PDF files..."
	@find . -maxdepth 2 -name "*.pdf" -delete

.PHONY: all pdfs clean
