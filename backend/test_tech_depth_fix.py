"""
Quick test script to verify the technical depth fix on old interview transcripts.

Run with:
    python test_tech_depth_fix.py

Make sure backend/.env has GROQ_API_KEY set.
"""

from dotenv import load_dotenv
load_dotenv()

from audio_utils import calculate_technical_depth

# ===== Your CV and JD from the previous interview =====
CV_TEXT = """KAVEEN PROJECTS EDUCATION LANGUAGES EXPERTISE REFERENCES TECHNICAL SKILLS
Critical Thinking Quick Learning & Initiative Problem Solving Creativity Technical
Proficiency Attention to Detail Effective Communication Time Management Adaptability
& Flexibiltiy Leadership and Persuasion I'm a detail-oriented and creative Data Science
undergraduate with a passion for storytelling, content creation, and client collaboration.
University of Plymouth (October 2023 - Present) BSc(Hons) in Data Science.
Araliya Hotels - Website - HTML, CSS. Vogue Collection - Website - HTML, CSS, JS, PHP."""

JD_TEXT = """Job Title: Data Science Intern. Job Summary: We are seeking a motivated and
detail-oriented Data Science Intern to join our team. The intern will support data-driven
decision-making by collecting, analyzing, and interpreting large datasets. This role provides
hands-on experience in data analysis, machine learning, and real-world business problem-solving.
Key Responsibilities: Collect, clean, and preprocess structured and unstructured data,
Perform exploratory data analysis (EDA) to identify patterns and trends, Assist in building
and evaluating machine learning models, Develop data visualizations and dashboards using
tools like Matplotlib, Power BI, or Tableau, Work with large datasets using Python, R, or SQL.
Required Qualifications: Currently pursuing a degree in Data Science, Computer Science,
Statistics, or a related field. Basic knowledge of programming languages such as Python or R.
Familiarity with data analysis libraries (e.g., Pandas, NumPy, Scikit-learn). Understanding of
statistics and machine learning concepts."""

# ===== Your old transcripts (the actual answers from your interview) =====
TEST_CASES = [
    {
        "id": "Q1 (rambling answer, no intent)",
        "transcript": "yes for sure so what I basically did was I downloaded the data set from Kegel and then I started cleaning so when cleaning it I first went for deleting the missing values which are not needed and for the ones needed I basically use the normal set of actions we use such as meaning the answers or like finding the mode and replacing the answers or some like that and that's the cleaning part and the pre-processing part of the large data set so basically I convert categorical data into contextual data and then so that's what I do for pre-processing so that kind of things I did to the UK road accident analysis as well",
        "old_score": 0,
    },
    {
        "id": "Q2 (data quality answer)",
        "transcript": "Yes, to ensure data quality during pre-processing, I follow a structured approach. First, I explore the dataset to understand its structure, data types, and identify issues like missing values, duplicates, or outliers. I usually use Python libraries like Pandas for this initial analysis. Then I handle missing data depending on the situation, either by imputing values using mean or median or removing records if they are not significant. I also check for duplicates and remove them too to avoid biasness. For outliers, I use techniques like the IQR method or ESET score to detect extreme values and then decide whether to cap or remove them based on context. I also make sure all the data types are correct and clean up inconsistent formats, especially in categorical data. In addition, I perform validation checks to ensure the data makes logical sense.",
        "old_score": 9,
    },
    {
        "id": "Q3 (UK road accident project)",
        "transcript": "Yes, one recent project I worked on involved analyzing a UK road accident dataset with over 1.2 million records. The goal was to identify patterns in accidents and understand the key factors affecting accident severity. First, I started with data exploration. I used Python and Pandas to understand the structure of the dataset, check data types and identify missing values and inconsistencies. Next, I handled missing data. columns like weather conditions and road surface had missing values so i used mode imputation for categorical variables and removed rows only when the missing data was too significant after that i cleaned and standardized the data there were inconsistencies in categorical fields so i normalized labels to ensure uniformity. Then I dealt with outliers. For example, in speed-related or numerical fields, I used the IQR method to detect extreme values.",
        "old_score": 7,
    },
    {
        "id": "Q8 (ARIMA / time series — the smoking gun)",
        "transcript": "Yes, during my data analysis projects, I had to learn time series analysis techniques, specifically ARIMA models for forecasting. It was new to me at the time, so I had to quickly build my understanding and apply it effectively. I started by learning the fundamentals, understanding concepts like stationarity, seasonality and autocorrelation. I used online resources and documentation and then moved on to hands-on practice using python libraries like stats models. once i understood the basics i applied it to my data set by first checking for stationarity and transforming the data where needed then i built and tuned the arima model step by step testing different parameters to improve accuracy.",
        "old_score": 7,
    },
    {
        "id": "Q9 (Matplotlib visualization)",
        "transcript": "Yes, in my UK road accident projects, I used data visualization to present key insights about accident severity stakeholders. I used Python libraries like Matplotlib and Seaborn to create clear visuals, such as bar charts to show accident severity by time of day and line charts to highlight threats over time. My main focus was clarity. I avoided clutter and highlighted only the most important patterns. For example, I used simple color coding to show how accidents were more severe at night and during poor weather conditions.",
        "old_score": 23,
    },
]


def main():
    print("=" * 70)
    print("TECHNICAL DEPTH FIX — TEST RUN")
    print("=" * 70)
    print()

    # Run each test case
    for i, case in enumerate(TEST_CASES, 1):
        print(f"\n{'─' * 70}")
        print(f"TEST {i}: {case['id']}")
        print(f"{'─' * 70}")

        result = calculate_technical_depth(
            transcript=case["transcript"],
            job_description=JD_TEXT,
            cv_text=CV_TEXT,
        )

        word_count = len(case["transcript"].split())
        density = (result["technical_term_count"] / word_count * 100) if word_count else 0

        print(f"  Old score:        {case['old_score']} / 100")
        print(f"  New score:        {result['technical_depth_score']} / 100")
        print(f"  Improvement:      {result['technical_depth_score'] - case['old_score']:+d}")
        print(f"  Word count:       {word_count}")
        print(f"  Term count:       {result['technical_term_count']}")
        print(f"  Density:          {density:.2f}%")
        print(f"  Terms found:      {', '.join(result['technical_terms_found'][:10])}")
        if len(result['technical_terms_found']) > 10:
            print(f"                    ... and {len(result['technical_terms_found']) - 10} more")
        print(f"  LLM extracted:    {len(result['relevant_terms_extracted'])} total terms")

    print()
    print("=" * 70)
    print("DONE — review scores above and decide if calibration is acceptable")
    print("=" * 70)


if __name__ == "__main__":
    main()