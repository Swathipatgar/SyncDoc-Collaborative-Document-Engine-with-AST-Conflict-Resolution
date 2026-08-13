const { getDocumentVersions } = require("../services/versionService");

const getVersions = async (req, res, next) => {
  try {
    const versions = await getDocumentVersions(req.params.id);
    res.json(versions);
  } catch (error) {
    next(error);
  }
};

module.exports = { getVersions };
