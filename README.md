## World Map of Microinsurance

This repository hosts the website for the [World Map of Microinsurance]().
Update the content and data by following the instructions below. Update the
code by checking out the `master` branch and following the build instructions
located there.

### Updating the content and data

#### HTML Updates

There are two HTML files which can be updated: `about.html` and `partners.html`.
 Both can be edited directly on GitHub by clicking on the file, then clicking
the edit button in the upper right.

 <img width="428" alt="microinsurance-dashboard-edit" src="https://cloud.githubusercontent.com/assets/7108211/9961248/7ae2be66-5ded-11e5-8d4d-23c70d5df020.png">

After making your changes, write a description of what you did then click
'Commit Changes'

<img width="877" alt="editing_microinsurance-dashboard-commit" src="https://cloud.githubusercontent.com/assets/7108211/9961311/cd92b666-5ded-11e5-9e53-8b072481d040.png">

#### CSV Updates

There are four `.csv` files which update the data and content of the site. They
are all located in the `assets/data` folder. For all of them, don't alter the
column headings or the site will break. Descriptions of the four individual
files can be found below. Edits can be made in one of two ways:

- Edit the file directly as described above.
  - If you are adding a new file in place of the old one and want to just copy
    that data in, follow these steps:
    - Save your data as a csv with the same column names
    - Open your csv in a text editor
    - Copy all of the data from there into the GitHub editor
    - 'Commit Changes'
- You can also make changes using `git` from the command-line or the
[Github Desktop](https://desktop.github.com/) editor.

##### mi-data.csv

The main data powering the site. Columns for additional years can be added as
long as the 'Indicators' are still named the same things. Rows with additional
countries can be added as well. All of the values should be numeric (for
instance, "<0.1" will cause a display error).

##### links.csv

This file stores which countries have links to additional information. The first
column should match the country's `iso3` found in the `mi-data.csv` file. The
second column should contain the full link to the page where additional
information can be found.

##### studies.csv

This file stores all the landscape study links. Match the existing format for
all columns.

##### types.csv

This file provides descriptions for the eight main microinsurance indicators.
Any text in the column, "description", will be shown on the info tooltips on the
site.
