# Глобальные переменные
config := ".chordpro.json"
songbook_name := "songbook.pdf"

# Собрать все PDF и книгу песен по умолчанию
all: pdfs songbook

# Сгенерировать индивидуальные PDF-страницы для каждой песни
pdfs:
    @echo "Generating individual PDFs..."
    @find . -maxdepth 2 -type f -name '*.cho' ! -name 'default.cho' | while read -r song; do \
        pdf="${song%.cho}.pdf"; \
        echo "Generating $pdf"; \
        chordpro --config={{config}} --output="$pdf" "$song"; \
    done

# Собрать общую книгу песен в один PDF-документ
songbook:
    @echo "Generating {{songbook_name}}..."
    @find . -maxdepth 2 -type f -name '*.cho' ! -name 'default.cho' | sort > .filelist.txt
    @chordpro --config={{config}} --filelist=.filelist.txt --output="{{songbook_name}}"
    @rm -f .filelist.txt

# Запустить локальный сервер веб-сайта в режиме разработки
dev:
    @echo "Starting local website development server..."
    cd website && npm install && npm run dev

# Собрать статический сайт для продакшена в website/dist/
site:
    @echo "Building local static website..."
    cd website && npm install && npm run build

# Удалить все сгенерированные PDF-файлы
clean:
    @echo "Cleaning PDFs..."
    find . -maxdepth 2 -name "*.pdf" -delete
