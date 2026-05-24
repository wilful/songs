# Глобальные переменные
config := ".chordpro.json"
songbook_name := "songbook.pdf"

# Собрать статический сайт по умолчанию
all: site

# Сгенерировать индивидуальные PDF-страницы для каждой песни в параллельном режиме (используя все ядра процессора)
pdfs:
    @echo "Generating individual PDFs in parallel..."
    @find . -maxdepth 2 -type f -name '*.cho' ! -name 'default.cho' -print0 | xargs -0 -P $(sysctl -n hw.ncpu) -I {} sh -c 'song="{}"; echo "Generating ${song%.cho}.pdf"; chordpro --config={{config}} --output="${song%.cho}.pdf" "$song"'


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
