const express = require('express');
const youtubedl = require('youtube-dl-exec');
const app = express();

app.get('/download', async (req, res) => {
  const url = req.query.url;
  const type = req.query.type || 'video'; // 'video' or 'audio'

  if (!url) return res.status(400).send('Error: URL parameter is required');

  try {
    // Get video info JSON
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });

    let format;

    if (type === 'audio') {
      // Find best audio-only format
      format = info.formats
        .filter(f => f.acodec !== 'none' && f.vcodec === 'none')
        .sort((a, b) => b.abr - a.abr)[0];
    } else {
      // Find best video+audio format
      format = info.formats
        .filter(f => f.acodec !== 'none' && f.vcodec !== 'none')
        .sort((a, b) => b.height - a.height)[0];
    }

    if (!format || !format.url) {
      return res.status(404).send('Error: Suitable format not found');
    }

    // Redirect to actual media url for direct download/streaming
    res.redirect(format.url);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: Failed to process the download request');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
})
