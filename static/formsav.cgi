#!/usr/bin/perl
push (@INC, '/cgi-bin');
require ('cgi-lib.pl');

# This should match the mail program on your system.
$mailprog = '/usr/sbin/sendmail';

# This should be set to the username or alias that processes the
# requests


#------ Change 1 ----- Replace the login with your actual login name


$recipient = "nmidkiff\@earthlink.net";


# Print out a content-type for HTTP/1.0 compatibility
print "Content-type: text/html\n\n";

# Print a title and initial heading
print '<Head><Title>Confirmation</Title></Head><Body BGCOLOR="#ffcc99">';

&ReadParse;

#------ Change 2 ----- Replace the login with your actual login name

open (MAIL, "|$mailprog $recipient") || die "Unable to send request\nPlease send e-mail to neil.midkiff\@stanfordalumni.org; Thank you\n";
#open (MAIL, ">test") || die "Cannot open STDOUT: $!\n";
print MAIL "Reply-to: $in{'emailaddr'}\n";
print MAIL "Subject: Stanford Savoyards Feedback Form\n";
print MAIL "\n\n";
#print "*$#in_key\n";
foreach $i (0 .. $#in_key){
#print "$in_key[$i] = $in_val[$i], i = $i <p>";
print MAIL "$in_key[$i] = $in_val[$i]\n";
}
print MAIL "-----------------------------------------------\n";
close (MAIL);


print "Thank you. Your request has been sent to the mailing list coordinator.<P>";
print '<A HREF="http://www.stanford.edu/group/savoyards/cgi-bin/contact">Return to Savoyards contact page</A></Body>';
