import json
import hashlib
import os
from typing import Dict, Any
import psycopg2
from psycopg2 import pool

connection_pool = None

def get_connection():
    global connection_pool
    if connection_pool is None:
        database_url = os.environ.get('DATABASE_URL')
        connection_pool = psycopg2.pool.SimpleConnectionPool(1, 10, database_url)
    return connection_pool.getconn()

def return_connection(conn):
    global connection_pool
    if connection_pool:
        connection_pool.putconn(conn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Check if password hash exists in compromised passwords database
    Args: event - dict with httpMethod, body containing password
          context - object with attributes: request_id, function_name
    Returns: HTTP response with breach information
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_str = event.get('body', '')
    
    if not body_str or body_str.strip() == '':
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Password is required'})
        }
    
    try:
        body_data = json.loads(body_str)
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
    
    password = body_data.get('password', '')
    
    if not password:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Password is required'})
        }
    
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT breach_count, first_seen, last_seen, source, severity
            FROM compromised_passwords
            WHERE password_hash = %s
        """
        
        cursor.execute(query, (password_hash,))
        result = cursor.fetchone()
        
        if result:
            breach_count, first_seen, last_seen, source, severity = result
            response_data = {
                'compromised': True,
                'breach_count': breach_count,
                'first_seen': first_seen.isoformat() if first_seen else None,
                'last_seen': last_seen.isoformat() if last_seen else None,
                'source': source,
                'severity': severity,
                'message': f'Этот пароль найден в {breach_count} утечках данных!'
            }
        else:
            response_data = {
                'compromised': False,
                'message': 'Пароль не найден в базе утечек'
            }
        
        cursor.close()
        return_connection(conn)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        if cursor:
            cursor.close()
        if conn:
            return_connection(conn)
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Database error: {str(e)}'})
        }