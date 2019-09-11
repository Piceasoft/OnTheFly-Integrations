/**
 * Logging module.
 * @module ./log
 *
 * @copyright Piceasoft 2019
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO EVENT 
 * SHALL THE COPYRIGHT HOLDERS OR ANYONE DISTRIBUTING THE SOFTWARE BE LIABLE 
 * FOR ANY DAMAGES OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT OR OTHERWISE, 
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR 
 * OTHER DEALINGS IN THE SOFTWARE.
 */



let m_ident = "";
let m_debugs = false;

function timestamp()
{
    return new Date().toISOString() + " ";
}

exports.setIdentify = function(ident)
{
    m_ident = ident;
};

exports.error = function (msg)
{
    console.error(timestamp() + m_ident + "[ERROR]:" + msg);
};

exports.warning = function (msg)
{
    console.error(timestamp() + m_ident + "[WARNING]:" + msg);
};

exports.alert = function (msg)
{
    console.error(timestamp() + m_ident + "[ALERT]:" + msg);
};

exports.info = function (msg)
{
    console.log(timestamp() + m_ident + "[INFO]:" + msg);
};

exports.debug = function (msg)
{
    if (m_debugs === true)
        console.log(timestamp() + m_ident + "[DEBUG]:" + msg);
};

exports.debugAlways = function (msg)
{
    console.log(timestamp() + m_ident + "[DEBUG]:" + msg);
};



exports.setDebugs = function (setOn)
{
    m_debugs = setOn ? true:false;
};

exports.isDebugsOn = function()
{
    return m_debugs;
};

