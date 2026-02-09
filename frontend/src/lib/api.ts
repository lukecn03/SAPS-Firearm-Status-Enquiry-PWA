import { parseFirearmStatusHtml, FirearmRecord } from './parser';
import { logger } from './logger';

export interface ProxyResponse {
  html: string;
  fetchedAt: string;
  query: {
    fsref: string;
    fserial?: string;
  };
}

interface ApiError {
  message: string;
  code?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

export async function queryFirearmStatus(
  fsref: string,
  fserial?: string
): Promise<{
  records: FirearmRecord[];
  fetchedAt: string;
  error?: ApiError;
}> {
  try {
    logger.debug('Firearm status query initiated', { fsref, fserial });
    
    // Validate inputs
    if (!fsref || fsref.trim().length === 0) {
      logger.warn('Query validation failed: Reference Number is required');
      return {
        records: [],
        fetchedAt: new Date().toISOString(),
        error: { message: 'Reference Number is required', code: 'INVALID_INPUT' }
      };
    }

    if (fsref.length > 40) {
      return {
        records: [],
        fetchedAt: new Date().toISOString(),
        error: {
          message: 'Reference Number exceeds maximum length',
          code: 'INVALID_INPUT'
        }
      };
    }

    if (fserial && fserial.length > 40) {
      return {
        records: [],
        fetchedAt: new Date().toISOString(),
        error: {
          message: 'Serial Number exceeds maximum length',
          code: 'INVALID_INPUT'
        }
      };
    }

    logger.debug('Fetching from API endpoint', { url: `${API_BASE_URL}/api/firearm-status` });
    
    const response = await fetch(`${API_BASE_URL}/api/firearm-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fsref: fsref.trim(),
        fserial: fserial ? fserial.trim() : undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logger.error('API error from upstream', { status: response.status, body: errorText });

      // Do not surface HTTP status codes to the UI. Present a generic
      // message that the upstream SAPS servers are unavailable.
      return {
        records: [],
        fetchedAt: new Date().toISOString(),
        error: {
          message: 'SAPS servers appear to be offline or not responding. Please try again later.',
          code: 'SAPS_OFFLINE'
        }
      };
    }

    const data: ProxyResponse = await response.json();

    // Parse the HTML response
    try {
      const parsed = parseFirearmStatusHtml(data.html);
      const records = parsed.records;
      logger.debug('HTML parsed successfully', { recordCount: records.length, noRecords: !!parsed.noRecords });

      if (parsed.noRecords) {
        logger.warn('Upstream reported no records for provided inputs', { info: parsed.noRecords });
        if (parsed.noRecords.type === 'REF_ONLY') {
          return {
            records: [],
            fetchedAt: data.fetchedAt,
            error: { message: `No records found for Reference Number ${parsed.noRecords.reference}`, code: 'INVALID_REFERENCE' }
          };
        }

        if (parsed.noRecords.type === 'REF_AND_SERIAL') {
          return {
            records: [],
            fetchedAt: data.fetchedAt,
            error: { message: `No records found for Reference Number ${parsed.noRecords.reference} and Serial Number ${parsed.noRecords.serial}`, code: 'INVALID_REFERENCE_AND_SERIAL' }
          };
        }
      }

      // Check if parsing returned no results (table parsing produced nothing)
      if (records.length === 0) {
        logger.warn('No results found for query', { fsref, fserial });
        return {
          records: [],
          fetchedAt: data.fetchedAt,
          error: { message: 'No results found for the provided information', code: 'NO_RESULTS' }
        };
      }

      logger.info('Query successful', { recordCount: records.length });
      return {
        records,
        fetchedAt: data.fetchedAt
      };
    } catch (parseError) {
      logger.error('HTML parsing failed', parseError);
      return {
        records: [],
        fetchedAt: data.fetchedAt,
        error: {
          message: 'Failed to parse results. The SAPS website may have changed format.',
          code: 'PARSE_ERROR'
        }
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Query error', { message });

    // For network / request failures, avoid exposing raw error details
    // or HTTP status codes to the UI. Return a user-friendly message
    // that attributes the problem to the SAPS servers being unavailable.
    return {
      records: [],
      fetchedAt: new Date().toISOString(),
      error: {
        message: 'SAPS servers appear to be offline or not responding. Please try again later.',
        code: 'SAPS_OFFLINE'
      }
    };
  }
}
