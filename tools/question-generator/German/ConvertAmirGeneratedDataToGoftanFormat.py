import json

with open("CommonSentencesNew.json", "w") as outcommonsentences:
    json_out_cs = []
    with open("CommonWordsNew.json", "w") as out:
        json_out = []
        with open("A1_Questions.json", "r") as f:
            l = json.load(f)
            for q in l['Test']['Questions']:
                if q['Type'] == 'Synonym' or q['Type'] == 'Antonym':
                    json_out.append({
                        "question": q['Question'],
                        "choices": q['Choices'],
                        "answer": q['Choices'].index(q['Answer']),
                        "type": "synonym/antonym",
                        "intent": "",
                        "extra": q['Type'] + "of:",
                        "level": "A1"
                    })
                else:
                    json_out_cs.append({
                        "question": q['Question'],
                        "choices": q['Choices'],
                        "answer": q['Choices'].index(q['Answer']),
                        "type": "common sentences",
                        "intent": "",
                        "extra": q['Type'],
                        "level": "A1"
                    })
        json.dump(json_out, out, indent=2, ensure_ascii=False)
    json.dump(json_out_cs, outcommonsentences, indent=2, ensure_ascii=False)

