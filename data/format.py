import csv


with open("persian/persian_A1/persian_A1_sentences_0200_orig.csv") as f:
    spamreader = csv.reader(f, delimiter='\t')
    with open("persian/persian_A1/persian_A1_sentences_0200.csv", "w") as f2:
        fwriter = csv.writer(f2, delimiter='\t')
        cnt = 0
        for row in spamreader:
            if cnt == 0:
                fwriter.writerow(row)
            else:
                fwriter.writerow([row[0], 'سلام! خوبی؟', row[2],  'خوبی', row[4], row[5], row[6], row[7], row[8]])
            # print(', '.join(row))