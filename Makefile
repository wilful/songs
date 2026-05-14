CONFIG := .chordpro.json
SONGS := $(shell find . -maxdepth 2 -type f -name '*.cho' ! -name 'default.cho' | sort)
PDFS := $(SONGS:.cho=.pdf)
SONGBOOK := songbook.pdf

.PHONY: all clean pdfs

# Build both individual PDFs and the combined songbook by default
all: pdfs $(SONGBOOK)

pdfs: $(PDFS)

%.pdf: %.cho $(CONFIG)
	@echo "Generating $@"
	@chordpro \
		--config=$(CONFIG) \
		--output="$@" \
		"$<"

$(SONGBOOK): $(SONGS) $(CONFIG)
	@echo "Generating $(SONGBOOK)"
	@# Using printf to handle potential special characters in filenames
	@printf '%s\n' $(SONGS) > .filelist.txt
	@chordpro \
		--config=$(CONFIG) \
		--filelist=.filelist.txt \
		--output="$@"
	@rm -f .filelist.txt

clean:
	@echo "Cleaning PDFs"
	@# Using find to catch all PDFs including those with spaces
	@find . -maxdepth 2 -name "*.pdf" -delete
