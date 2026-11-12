import csv

with open('antonyms.csv', 'w') as f2:
    writer = csv.writer(f2)
    with open('initial_antonyms.csv') as f:
        reader = csv.reader(f)
        for r in reader:
            e = r[0]
            if ',' in r[0]:
                e = r[0].split(',')

            a = r[1]
            if ',' in r[1]:
                a = r[1].split(',')

            b = r[2]
            if ',' in r[2]:
                b = r[2].split(',')

            c = r[3]
            if ',' in r[3]:
                b = r[3].split(',')

            for d1 in r[1].split(','):
                for d2 in r[2].split(','):
                    for d3 in r[3].split(','):
                        for d4 in r[0].split(','):
                            writer.writerow([d4.strip(), d1.strip(), d2.strip(), d3.strip()])