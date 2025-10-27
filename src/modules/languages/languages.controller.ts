import { Request, Response } from 'express';
import i18next from '../../config/i18n.config';

export const getAvailableLanguages = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'languages', serviceHandler: 'getAvailableLanguages' });
  req.logger.info({ status: 'start' });

  try {
    const allLanguages = i18next.options.supportedLngs || ['es', 'en', 'pt'];
    const availableLanguages = allLanguages.filter(lang => lang !== 'cimode');
    
    const languagesWithNames = availableLanguages.map(code => ({
      name: req.t(`languages.names.${code}`),
      code: code
    }));
    
    return res.status(200).json({
      languages: languagesWithNames,
      message: req.t('languages.available.success'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ 
      message: req.t('languages.available.error'), 
      error: error.message 
    });
  }
};
