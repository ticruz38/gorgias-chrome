/* Gmail plugin
 */

App.plugin('gmail', (function () {

    var isContentEditable = function (element) {
        return element && element.hasAttribute('contenteditable');
    };

    var parseList = function (list) {
        return list.filter(function (a) {
            return a;
        }).map(function (a) {
            return parseString(a);
        });
    };

    var regExString = /"?([^ ]*)\s*(.*)"?\s*<([^>]+)>/;
    var regExEmail = /([\w!.%+\-])+@([\w\-])+(?:\.[\w\-]+)+/;

    var parseString = function (string) {
        //XXX: Gmail changed the title to: Account  Firstname Lastname so we remove it
        string = string.replace('Account ', '');
        var match = regExString.exec(string),
            data = {
                name: '',
                first_name: '',
                last_name: '',
                email: ''
            };

        if (match && match.length >= 4) {
            data.first_name = match[1].replace('"', '').trim();
            data.last_name = match[2].replace('"', '').trim();
            data.name = data.first_name + (data.first_name && data.last_name ? ' ' : '') + data.last_name;
            data.email = match[3];
        } else {
            // try to match the email
            match = regExEmail.exec(string);
            if (match) {
                data.email = match[0];
            }
        }

        return data;
    };

    // get all required data from the dom
    var getData = function (params, callback) {

        var from = [],
            to = [],
            cc = [],
            bcc = [],
            subject = '';

        if (isContentEditable(params.element)) {
            var $container = $(params.element).closest('table').parent().closest('table').parent().closest('table');

            var fromContainer = $('.gb_2a');
            if (!fromContainer.length) {
                fromContainer = $('.gb_4a');
            }

            var fromEmailName = '';
            if (fromContainer.length) {
                fromEmailName = '';
                var title = fromContainer.attr('title');
                if (title) {
                    fromEmailName = $.trim(title.split(":")[1]).replace('(', '<').replace(')', '>').replace("\n", '');
                }
            }

            from.push(fromEmailName);
            to = $container.find('input[name=to]').toArray().map(function (a) {
                return a.value;
            });
            cc = $container.find('input[name=cc]').toArray().map(function (a) {
                return a.value;
            });
            bcc = $container.find('input[name=bcc]').toArray().map(function (a) {
                return a.value;
            });
            subject = $container.find('input[name=subjectbox]').val().replace(/^Re: /, "");

        } else {

            from.push($('#guser').find('b').text());
            var toEl = $('#to');

            // Full options window
            if (toEl.length) {
                to = toEl.val().split(',');
                cc = $('#cc').val().split(',');
                bcc = $('#bcc').val().split(',');
                subject = $('input[name=subject]').val();
            } else { // Reply window
                subject = $('h2 b').text();
                var replyToAll = $('#replyall');
                // It there are multiple reply to options
                if (replyToAll.length) {
                    to = $('input[name=' + replyToAll.attr('name') + ']:checked').closest('tr').find('label')
                        // retrieve text but child nodes
                        .clone().children().remove().end().text().trim().split(',');
                } else {
                    to = $(params.element).closest('table').find('td').first().find('td').first()
                        // retrieve text but child nodes
                        .clone().children().remove().end().text().trim().split(',');
                }
            }

        }

        var vars = {
            from: parseList(from),
            to: parseList(to),
            cc: parseList(cc),
            bcc: parseList(bcc),
            subject: subject
        };
        if (callback) {
            callback(null, vars);
        }

    };

    var setTitle = function (params, callback) {
        getData(params, function (_, vars) {
            var parsedSubject = Handlebars.compile(params.quicktext.subject)(PrepareVars(vars));

            var $subjectField = $(params.element).closest('table.aoP').find('input[name=subjectbox]');
            $subjectField.val(parsedSubject);

            var response = {};

            if (callback) {
                callback(null, response);
            }
        });
    };

    var init = function (params, callback) {

        var gmailUrl = '//mail.google.com/';

        var activateExtension = false;

        // trigger the extension based on url
        if (window.location.href.indexOf(gmailUrl) !== -1) {
            activateExtension = true;
        }

        // return true as response if plugin should be activated
        if (callback) {
            // first param is the error
            // second is the response
            callback(null, activateExtension);
        }

    };

    return {
        init: init,
        getData: getData,
        setTitle: setTitle
    }

})());
