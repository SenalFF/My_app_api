const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const prettyBytes = require('pretty-bytes');

const app = express();
const PORT = 3000;

app.use(cors());

// Basic check
app.get('/', (req, res) => {
  res.send('YouTube Downloader API is running!');
});

// Get available formats
app.get('/formats', async (req, res) => {
  const videoURL = req.query.url;
  
  if (!videoURL || !ytdl.validateURL(videoURL)) {
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }

  try {
    const info = await ytdl.getInfo(videoURL);
    const formats = info.formats.map(format => ({
      itag: format.itag,
      mimeType: format.mimeType,
      qualityLabel: format.qualityLabel,
      container: format.container,
      hasVideo: !!format.qualityLabel,
      hasAudio: !!format.audioBitrate,
      size: format.contentLength ? prettyBytes(Number(format.contentLength)) : 'N/A',
    }));

    res.json({ title: info.videoDetails.title, formats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve formats' });
  }
});

// Download endpoint with format selection
app.get('/download', async (req, res) => {
  const videoURL = req.query.url;
  const itag = req.query.itag; // format ID
  
  if (!videoURL || !ytdl.validateURL(videoURL)) {
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }

  try {
    const info = await ytdl.getInfo(videoURL);
    const format = ytdl.chooseFormat(info.formats, { quality: itag });

    if (!format) return res.status(404).json({ error: 'Format not found' });

    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    const ext = format.container || 'mp4';

    res.setHeader('Content-Disposition', `attachment; filename="${title}.${ext}"`);
    ytdl(videoURL, { format }).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to download video' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
