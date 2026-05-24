CONFIG := .chordpro.json
SONGS := $(shell find . -maxdepth 2 -type f -name '*.cho' ! -name 'default.cho' | sort)
PDFS := $(SONGS:.cho=.pdf)
SONGBOOK := songbook.pdf

.PHONY: all clean pdfs dev site songbook

# By default, build the static website
all: site

pdfs: $(PDFS)

%.pdf: %.cho $(CONFIG)
	@echo "Generating $@"
	@chordpro \
		--config=$(CONFIG) \
		--output="$@" \
		"$<"

songbook: $(SONGBOOK)

$(SONGBOOK): $(SONGS) $(CONFIG)
	@echo "Generating $(SONGBOOK)"
	@# Using printf to handle potential special characters in filenames
	@printf '%s\n' $(SONGS) > .filelist.txt
	@chordpro \
		--config=$(CONFIG) \
		--filelist=.filelist.txt \
		--output="$@"
	@rm -f .filelist.txt

dev:
	@echo "Starting local website development server..."
	@cd website && npm install && npm run dev

site:
	@echo "Building local static website..."
	@cd website && npm install && npm run build

clean:
	@echo "Cleaning PDFs"
	@# Using find to catch all PDFs including those with spaces
	@find . -maxdepth 2 -name "*.pdf" -delete

