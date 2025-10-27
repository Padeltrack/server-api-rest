import axios from 'axios';
import LoggerColor from 'node-color-log';

const testLanguagesEndpoint = async () => {
  try {
    LoggerColor.color('cyan').log('🧪 Testing languages endpoint with names...');
    
    const baseUrl = 'http://localhost:3000';
    const endpoint = `${baseUrl}/api/languages/available`;
    
    // Probar con diferentes idiomas
    const languages = ['es', 'en', 'pt'];
    
    for (const lang of languages) {
      LoggerColor.color('yellow').log(`\n🌐 Testing with language: ${lang}`);
      
      const response = await axios.get(endpoint, {
        headers: {
          'Accept-Language': lang,
          'Content-Type': 'application/json'
        }
      });
      
      LoggerColor.color('green').log(`✅ Response for ${lang}:`);
      console.log(JSON.stringify(response.data, null, 2));
      
      // Verificar estructura
      if (response.data.languages && Array.isArray(response.data.languages)) {
        LoggerColor.color('blue').log(`📋 Languages found:`);
        response.data.languages.forEach((langItem: any) => {
          LoggerColor.color('cyan').log(`  - ${langItem.name} (${langItem.code})`);
        });
      }
    }
    
    LoggerColor.color('green').log('\n✅ Languages endpoint test completed successfully!');
    
  } catch (error) {
    LoggerColor.error('❌ Test failed:');
    if (error.response) {
      LoggerColor.error(`Status: ${error.response.status}`);
      LoggerColor.error(`Data:`, error.response.data);
    } else {
      LoggerColor.error(`Error:`, error.message);
    }
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  testLanguagesEndpoint();
}

export { testLanguagesEndpoint };
