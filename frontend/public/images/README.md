Place the dashboard background image here as `dashboard-bg.jpg`.

Recommended: download the image with PowerShell (run from the `frontend` folder):

```powershell
Invoke-WebRequest -Uri "https://scontent.facc1-1.fna.fbcdn.net/v/t39.30808-6/584895586_1432706232194564_6166147380417894651_n.jpg?stp=c342.0.1365.1365a_dst-jpg_s206x206_tt6&_nc_cat=109&ccb=1-7&_nc_sid=714c7a&_nc_eui2=AeHwJGQ6_39GLvFWHn1XiDXHW5mh4gLqVM9bmaHiAupUz2eaK4Vd_tzK5T6rAMova3uI_IfyMqxFDQ9zeyiPuBEg&_nc_ohc=zRVkR8y6FoUQ7kNvwGZnmip&_nc_oc=AdmtaXmhsqEB5wI6AnqqnmbzG-klJTb67RY1nzomeq0dGs-1XxJ6PmRqIjsgEjSuPyQ&_nc_zt=23&_nc_ht=scontent.facc1-1.fna&_nc_gid=9I7-3YrRh1V5l2dX4ue9AQ&oh=00_AfusOBA09Z09jAPcEBkHd0KjibFexxf1t-AvQmhnZD46qQ&oe=699639DA" -OutFile public\images\dashboard-bg.jpg
```

If PowerShell blocks the download (hotlinking or access restrictions), manually save the image from the browser and place it at `public/images/dashboard-bg.jpg`.

After placing the file re-run the build or start the dev server to see the background.
